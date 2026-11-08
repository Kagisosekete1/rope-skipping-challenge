-- Server-clock online play and non-cash points escrow. Apply after migration 002.
begin;
create table if not exists public.challenge_rooms(
 id uuid primary key default gen_random_uuid(),invite_code text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),
 host_id uuid not null references public.profiles(id),guest_id uuid references public.profiles(id),stake bigint not null check(stake>0 and stake<=4503599627370495),
 client_request_id uuid not null,status text not null default 'waiting' check(status in ('waiting','active','complete','cancelled')),
 state jsonb not null default '{}',winner_id uuid references public.profiles(id),
 created_at timestamptz not null default now(),expires_at timestamptz not null default(now()+interval '15 minutes'),updated_at timestamptz not null default now(),unique(host_id,client_request_id),check(guest_id is null or guest_id<>host_id)
);
create table if not exists public.challenge_actions(
 room_id uuid not null references public.challenge_rooms(id) on delete cascade,request_id uuid not null,user_id uuid not null references public.profiles(id),action text not null,created_at timestamptz not null default now(),primary key(room_id,request_id)
);
alter table public.challenge_rooms enable row level security;
alter table public.challenge_actions enable row level security;
revoke all on public.challenge_rooms,public.challenge_actions from anon,authenticated;
grant select on public.challenge_rooms,public.challenge_actions to authenticated;
grant all on public.challenge_rooms,public.challenge_actions to service_role;
drop policy if exists rsc_room_participant on public.challenge_rooms;
create policy rsc_room_participant on public.challenge_rooms for select to authenticated using(auth.uid() in (host_id,guest_id));
drop policy if exists rsc_action_participant on public.challenge_actions;
create policy rsc_action_participant on public.challenge_actions for select to authenticated using(exists(select 1 from public.challenge_rooms r where r.id=room_id and auth.uid() in(r.host_id,r.guest_id)));

create or replace function public.rsc_room_initial() returns jsonb language sql immutable as $$select '{"state":"idle","current":0,"progress":[0,0],"needed":0,"done":0,"combo":0,"best":0,"round":1,"jump_at":null,"feedback":"Host rolls first","powers":[{"block":1,"shield":1,"slow":1,"boost":1},{"block":1,"shield":1,"slow":1,"boost":1}],"effects":[{},{}],"frozen_until":[0,0]}'::jsonb;$$;
create or replace function public.rsc_finish_challenge(p_room uuid,p_winner integer) returns void language plpgsql security definer set search_path=public,pg_temp as $$declare r public.challenge_rooms%rowtype;winner uuid;begin
 select * into r from public.challenge_rooms where id=p_room for update;if r.status<>'active' then return;end if;
 winner=case when p_winner=0 then r.host_id else r.guest_id end;
 perform 1 from public.challenge_wallets where user_id in(r.host_id,r.guest_id) order by user_id for update;
 insert into public.points_ledger(user_id,delta,reason,request_key) values(winner,r.stake*2,'Challenge winner takes pot','room-payout:'||r.id);
 update public.challenge_wallets set points=points+r.stake*2,lifetime_earned=lifetime_earned+r.stake,online_wins=online_wins+1,updated_at=now() where user_id=winner;
 update public.challenge_rooms set status='complete',winner_id=winner,state=state||jsonb_build_object('state','over','winner',p_winner,'feedback','Challenge complete!'),updated_at=now() where id=r.id;
end;$$;
create or replace function public.rsc_refund_challenge(p_room uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$declare r public.challenge_rooms%rowtype;u uuid;begin
 select * into r from public.challenge_rooms where id=p_room for update;if r.status not in('waiting','active') then return;end if;
 perform 1 from public.challenge_wallets where user_id in(r.host_id,r.guest_id) order by user_id for update;
 foreach u in array array[r.host_id,r.guest_id] loop if u is not null then
 insert into public.points_ledger(user_id,delta,reason,request_key) values(u,r.stake,'Challenge stake refunded','room-refund:'||r.id);
 update public.challenge_wallets set points=points+r.stake where user_id=u;end if;end loop;
 update public.challenge_rooms set status='cancelled',state=state||jsonb_build_object('state','cancelled','feedback','Challenge cancelled — stakes refunded'),updated_at=now() where id=r.id;
end;$$;

-- Only this function evaluates rope crossings, cooldowns and progress. Browser scores are never accepted.
create or replace function public.rsc_advance_challenge(p_room uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$
 declare r public.challenge_rooms%rowtype;s jsonb;t double precision=extract(epoch from clock_timestamp())*1000;deadline double precision;crossing double precision;age double precision;cur integer;done integer;progress integer;period integer;good boolean;perfect boolean;shield boolean;boost boolean;i integer;begin
 select * into r from public.challenge_rooms where id=p_room for update;
 if r.status='waiting' then if r.expires_at<now() then perform public.rsc_refund_challenge(r.id);end if;return;end if;
 if r.status<>'active' then return;end if;
 if r.created_at<now()-interval '60 minutes' then perform public.rsc_refund_challenge(r.id);return;end if;
 s=r.state;
 for i in 1..24 loop
  cur=(s->>'current')::integer;deadline=coalesce((s->>'deadline')::double precision,t+45000);
  if s->>'state'='idle' then if t>deadline then perform public.rsc_finish_challenge(r.id,1-cur);end if;exit;
  elsif s->>'state'='rolling' then
   if t<deadline then exit;end if;s=s||jsonb_build_object('state','ready','deadline',deadline+1400,'feedback',(s->>'needed')||' jumps — get ready!');
  elsif s->>'state'='ready' then
   if t<deadline then exit;end if;s=s||jsonb_build_object('state','skipping','next_crossing',deadline+950,'period_ms',1900,'feedback','Find the green and jump!');
  elsif s->>'state'='turnEnd' then
   if t<deadline then exit;end if;cur=1-cur;s=s||jsonb_build_object('state','idle','current',cur,'deadline',deadline+45000,'round',(s->>'round')::integer+case when cur=0 then 1 else 0 end,'feedback','Next player — roll the dice!','jump_at',null);
   s=jsonb_set(s,array['effects',cur::text,'slow'],'false'::jsonb,true);
  elsif s->>'state'='skipping' then
   crossing=(s->>'next_crossing')::double precision;if t<crossing then exit;end if;
   age=case when s->>'jump_at' is null then 10000 else crossing-(s->>'jump_at')::double precision end;
   good=age between 90 and 670;perfect=age between 250 and 510;shield=coalesce((s#>>array['effects',cur::text,'shield'])::boolean,false);boost=coalesce((s#>>array['effects',cur::text,'boost'])::boolean,false);
   if good then
    done=(s->>'done')::integer+1;progress=least(100,(s->'progress'->>cur)::integer+(5+case when perfect then 2 else 0 end)*case when boost then 2 else 1 end);
    if done>=(s->>'needed')::integer then progress=least(100,progress+5);end if;
    s=jsonb_set(s,array['progress',cur::text],to_jsonb(progress));s=jsonb_set(s,array['effects',cur::text,'boost'],'false'::jsonb,true);
    s=s||jsonb_build_object('done',done,'combo',(s->>'combo')::integer+1,'best',greatest((s->>'best')::integer,(s->>'combo')::integer+1),'result',case when perfect then 'perfect' else 'good' end,'feedback',case when perfect then 'PERFECT!' else 'Nice jump!' end);
    if progress>=100 then update public.challenge_rooms set state=s where id=r.id;perform public.rsc_finish_challenge(r.id,cur);return;end if;
    if done>=(s->>'needed')::integer then s=s||jsonb_build_object('state','turnEnd','deadline',crossing+1650,'feedback','Challenge clear!');else
     period=greatest(1050,1900-done*90);if coalesce((s#>>array['effects',cur::text,'slow'])::boolean,false) then period=round(period*1.35);end if;
     s=s||jsonb_build_object('period_ms',period,'next_crossing',crossing+period);end if;
   elsif shield then
    s=jsonb_set(s,array['effects',cur::text,'shield'],'false'::jsonb,true);s=s||jsonb_build_object('next_crossing',crossing+(s->>'period_ms')::integer,'feedback','Shield saved the jump!','result','shield');
   else s=s||jsonb_build_object('state','turnEnd','deadline',crossing+1650,'combo',0,'feedback','Rope caught! Next turn','result','miss');end if;
  else exit;end if;
 end loop;
 if (select status from public.challenge_rooms where id=r.id)='active' then update public.challenge_rooms set state=s,updated_at=now() where id=r.id;end if;
end;$$;

create or replace function public.rsc_challenge_json(p_room uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$declare r public.challenge_rooms%rowtype;names jsonb;begin
 select * into r from public.challenge_rooms where id=p_room;
 if auth.uid() is null or (auth.uid() is distinct from r.host_id and auth.uid() is distinct from r.guest_id) then raise exception 'Challenge access denied';end if;
 select jsonb_build_array((select display_name from public.profiles where id=r.host_id),(select display_name from public.profiles where id=r.guest_id)) into names;
 return r.state||jsonb_build_object('room_id',r.id,'invite_code',r.invite_code,'status',r.status,'stake',r.stake,'names',names,'mySlot',case when auth.uid()=r.host_id then 0 else 1 end,'mode','online','server_now',extract(epoch from clock_timestamp())*1000,'wallet',public.get_my_points());end;$$;
create or replace function public.create_challenge(p_stake bigint,p_request_id uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$declare u uuid=auth.uid();balance bigint;r uuid;begin
 if u is null then raise exception 'Sign in to challenge a friend';end if;
 select id into r from public.challenge_rooms where host_id=u and client_request_id=p_request_id;if found then return public.rsc_challenge_json(r);end if;
 if p_stake<1 or p_stake>4503599627370495 then raise exception 'Use a positive whole-number stake';end if;
 select points into balance from public.challenge_wallets where user_id=u for update;if balance is null or balance<p_stake then raise exception 'Not enough available points';end if;
 insert into public.challenge_rooms(host_id,stake,client_request_id,state) values(u,p_stake,p_request_id,public.rsc_room_initial()) returning id into r;
 update public.challenge_wallets set points=points-p_stake where user_id=u;
 insert into public.points_ledger(user_id,delta,reason,request_key) values(u,-p_stake,'Challenge stake held','room-stake:'||r);
 return public.rsc_challenge_json(r);end;$$;
create or replace function public.preview_challenge(p_code text) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$declare r public.challenge_rooms%rowtype;n text;begin
 if auth.uid() is null then raise exception 'Sign in first';end if;select * into r from public.challenge_rooms where invite_code=upper(btrim(p_code));
 if not found or r.status<>'waiting' or r.expires_at<now() then raise exception 'Invitation is unavailable or expired';end if;
 select display_name into n from public.profiles where id=r.host_id;return jsonb_build_object('host',n,'stake',r.stake,'pot',r.stake*2,'invite_code',r.invite_code);end;$$;
create or replace function public.accept_challenge(p_code text) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$declare u uuid=auth.uid();r public.challenge_rooms%rowtype;balance bigint;s jsonb;begin
 if u is null then raise exception 'Sign in first';end if;select * into r from public.challenge_rooms where invite_code=upper(btrim(p_code)) for update;
 if not found then raise exception 'Invitation not found';end if;
 if r.guest_id=u and r.status='active' then return public.rsc_challenge_json(r.id);end if;
 if r.host_id=u then raise exception 'Invite another player';end if;
 if r.status<>'waiting' or r.expires_at<now() then raise exception 'Invitation expired or already accepted';end if;
 select points into balance from public.challenge_wallets where user_id=u for update;if balance is null or balance<r.stake then raise exception 'Not enough available points';end if;
 update public.challenge_wallets set points=points-r.stake where user_id=u;
 insert into public.points_ledger(user_id,delta,reason,request_key) values(u,-r.stake,'Challenge stake held','room-stake:'||r.id);
 s=public.rsc_room_initial()||jsonb_build_object('deadline',extract(epoch from clock_timestamp())*1000+45000);
 update public.challenge_rooms set guest_id=u,status='active',state=s,updated_at=now() where id=r.id;return public.rsc_challenge_json(r.id);end;$$;

create or replace function public.challenge_action(p_room uuid,p_action text,p_request_id uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
 declare u uuid=auth.uid();r public.challenge_rooms%rowtype;s jsonb;slot integer;cur integer;target integer;tokens integer;t double precision=extract(epoch from clock_timestamp())*1000;remaining double precision;period integer;begin
 select * into r from public.challenge_rooms where id=p_room for update;
 if u is null or (u is distinct from r.host_id and u is distinct from r.guest_id) then raise exception 'Challenge access denied';end if;
 perform public.rsc_advance_challenge(r.id);select * into r from public.challenge_rooms where id=p_room;
 slot=case when u=r.host_id then 0 else 1 end;s=r.state;cur=(s->>'current')::integer;
 if r.status in('complete','cancelled') and p_action in('cancel','forfeit') then return public.rsc_challenge_json(r.id);end if;
 if p_action='poll' then return public.rsc_challenge_json(r.id);end if;
 if exists(select 1 from public.challenge_actions where room_id=r.id and request_id=p_request_id) then return public.rsc_challenge_json(r.id);end if;
 if p_action='cancel' and r.status='waiting' and u=r.host_id then perform public.rsc_refund_challenge(r.id);return public.rsc_challenge_json(r.id);end if;
 if r.status<>'active' then raise exception 'Match is not active';end if;
 if p_action='forfeit' then perform public.rsc_finish_challenge(r.id,1-slot);return public.rsc_challenge_json(r.id);end if;
 if p_action='roll' then
  if cur<>slot or s->>'state'<>'idle' then raise exception 'Wait for your turn';end if;
  s=s||jsonb_build_object('state','rolling','needed',1+floor(random()*6)::integer,'done',0,'deadline',t+1700,'jump_at',null,'feedback','Rolling the dice…');
 elsif p_action='jump' then
  if cur<>slot or s->>'state'<>'skipping' then raise exception 'Wait for your turn';end if;
  if coalesce((s->'frozen_until'->>slot)::double precision,0)>t then raise exception 'You are frozen';end if;
  if s->>'jump_at' is not null and t-(s->>'jump_at')::double precision<820 then raise exception 'Jump is still airborne';end if;
  s=s||jsonb_build_object('jump_at',t);
 elsif p_action in('block','shield','slow','boost') then
  if p_action<>'block' and cur<>slot then raise exception 'Use this during your turn';end if;
  if coalesce((s#>>array['powers',slot::text,p_action])::integer,0)<1 then raise exception 'Power-up already used';end if;
  s=jsonb_set(s,array['powers',slot::text,p_action],'0'::jsonb);s=jsonb_set(s,array['effects',slot::text,p_action],'true'::jsonb,true);
  if p_action='slow' and s->>'state'='skipping' then period=round((s->>'period_ms')::integer*1.35);remaining=greatest(0,(s->>'next_crossing')::double precision-t)*1.35;s=s||jsonb_build_object('period_ms',period,'next_crossing',t+remaining);end if;
  s=s||jsonb_build_object('feedback',initcap(p_action)||' activated');
 elsif p_action='freeze' then
  if cur=slot or s->>'state'<>'skipping' then raise exception 'Freeze the opponent during their jumps';end if;
  select freeze_tokens into tokens from public.challenge_wallets where user_id=u for update;if tokens<1 then raise exception 'Buy Freeze with points first';end if;
  update public.challenge_wallets set freeze_tokens=freeze_tokens-1 where user_id=u;
  insert into public.points_ledger(user_id,delta,reason,request_key) values(u,0,'Online Freeze used','freeze-online:'||p_request_id);
  target=1-slot;
  if coalesce((s#>>array['effects',target::text,'block'])::boolean,false) then s=jsonb_set(s,array['effects',target::text,'block'],'false'::jsonb);s=s||jsonb_build_object('feedback','Freeze blocked!');
  else s=jsonb_set(s,array['frozen_until',target::text],to_jsonb(t+1500));s=s||jsonb_build_object('jump_at',null,'feedback','Player frozen for 1.5 seconds!');end if;
 else raise exception 'Unknown action';end if;
 insert into public.challenge_actions(room_id,request_id,user_id,action) values(r.id,p_request_id,u,p_action);
 update public.challenge_rooms set state=s,updated_at=now() where id=r.id;return public.rsc_challenge_json(r.id);end;$$;

create or replace function public.my_challenges() returns setof jsonb language plpgsql security definer set search_path=public,pg_temp as $$declare r record;begin
 if auth.uid() is null then raise exception 'Sign in first';end if;
 for r in select id from public.challenge_rooms where auth.uid() in(host_id,guest_id) and status in('waiting','active') order by created_at desc limit 10 loop
 perform public.rsc_advance_challenge(r.id);return next public.rsc_challenge_json(r.id);end loop;end;$$;
revoke all on function public.rsc_room_initial(),public.rsc_finish_challenge(uuid,integer),public.rsc_refund_challenge(uuid),public.rsc_advance_challenge(uuid),public.rsc_challenge_json(uuid) from public,anon,authenticated;
revoke all on function public.create_challenge(bigint,uuid),public.preview_challenge(text),public.accept_challenge(text),public.challenge_action(uuid,text,uuid),public.my_challenges() from public,anon;
grant execute on function public.create_challenge(bigint,uuid),public.preview_challenge(text),public.accept_challenge(text),public.challenge_action(uuid,text,uuid),public.my_challenges() to authenticated;
commit;
