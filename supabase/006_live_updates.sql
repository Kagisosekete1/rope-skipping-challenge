-- Optional push updates for authenticated players. Apply after 005.
-- Existing row-level policies still restrict rooms to participants and wallets to their owner.
-- Leaderboard uses its existing public, sanitized RPC; private wallets are never made public.
begin;
create or replace function public.rsc_touch_points_wallet() returns trigger language plpgsql set search_path=public,pg_temp as $$begin new.updated_at=clock_timestamp();return new;end $$;
drop trigger if exists rsc_points_wallet_updated on public.challenge_wallets;
create trigger rsc_points_wallet_updated before update on public.challenge_wallets for each row execute function public.rsc_touch_points_wallet();
create or replace function public.get_my_points() returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$declare w public.challenge_wallets%rowtype;begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 select * into w from public.challenge_wallets where user_id=auth.uid();
 return jsonb_build_object('points',w.points,'freeze_tokens',w.freeze_tokens,'online_wins',w.online_wins,'updated_at',w.updated_at);
end $$;
revoke all on function public.get_my_points() from public,anon;
grant execute on function public.get_my_points() to authenticated;

do $$
declare t text;
begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
  foreach t in array array['challenge_rooms','challenge_wallets'] loop
   if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=t) then
    execute format('alter publication supabase_realtime add table public.%I',t);
   end if;
  end loop;
 end if;
end $$;
commit;
