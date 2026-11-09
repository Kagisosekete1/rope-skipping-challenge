-- Apply after 006. A six grants a same-turn reroll, not jumps or points.
begin;
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
   if t<deadline then exit;end if;
   if (s->>'needed')::integer=6 then s=s||jsonb_build_object('state','idle','reroll',true,'deadline',t+45000,'jump_at',null,'feedback','Six! Tap the die to roll again — same turn!');exit;end if;
   s=s||jsonb_build_object('state','ready','reroll',false,'deadline',deadline+1400,'feedback',(s->>'needed')||' jumps — get ready!');
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


revoke all on function public.rsc_advance_challenge(uuid) from public,anon,authenticated;
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
  s=s||jsonb_build_object('state','rolling','reroll',false,'needed',1+floor(random()*6)::integer,'done',0,'deadline',t+1700,'jump_at',null,'feedback','Rolling the dice…');
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


revoke all on function public.challenge_action(uuid,text,uuid) from public,anon;
grant execute on function public.challenge_action(uuid,text,uuid) to authenticated;
commit;
