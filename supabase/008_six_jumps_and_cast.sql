-- Apply after 007. Six jumps first; clear all six to earn another roll on the same turn.
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
   if t<deadline then exit;end if;s=s||jsonb_build_object('state','ready','reroll',false,'deadline',deadline+1400,'feedback',(s->>'needed')||' jumps — get ready!');
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
    if done>=(s->>'needed')::integer then
     if (s->>'needed')::integer=6 then s=s||jsonb_build_object('state','idle','reroll',true,'deadline',t+45000,'jump_at',null,'feedback','Six jumps cleared! Bonus roll — your turn continues!');
     else s=s||jsonb_build_object('state','turnEnd','reroll',false,'deadline',crossing+1650,'feedback','Challenge clear!');end if;
    else
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
 return r.state||jsonb_build_object('room_id',r.id,'invite_code',r.invite_code,'status',r.status,'stake',r.stake,'names',names,'avatars',jsonb_build_array((select avatar from public.profiles where id=r.host_id),(select avatar from public.profiles where id=r.guest_id)),'mySlot',case when auth.uid()=r.host_id then 0 else 1 end,'mode','online','server_now',extract(epoch from clock_timestamp())*1000,'wallet',public.get_my_points());end;$$;

revoke all on function public.rsc_advance_challenge(uuid),public.rsc_challenge_json(uuid) from public,anon,authenticated;
commit;
