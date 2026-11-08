-- Apply after upgrade-2.2.sql. Practice saves cannot modify trusted point wallets.
begin;
create table if not exists public.practice_progress (
 user_id uuid primary key references auth.users(id) on delete cascade,
 save jsonb not null default '{}'::jsonb check(jsonb_typeof(save)='object' and octet_length(save::text)<65536),
 updated_at timestamptz not null default now()
);
alter table public.practice_progress enable row level security;
drop policy if exists practice_owner on public.practice_progress;
create policy practice_owner on public.practice_progress for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
grant select,insert,update,delete on public.practice_progress to authenticated;
-- Open challenges must be resolved explicitly so another player's stake is not lost.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare u uuid:=auth.uid();
begin
 if u is null then raise exception 'Sign in to delete your account';end if;
 -- Lock the profile against concurrent room creation/acceptance FK checks.
 perform 1 from public.profiles where id=u for update;
 if exists(select 1 from public.challenge_rooms where (host_id=u or guest_id=u) and status in ('waiting','active')) then
  raise exception 'Finish or cancel your online challenges before deleting your account';
 end if;
 delete from public.challenge_rooms where host_id=u or guest_id=u;
 delete from auth.users where id=u;
end $$;
revoke all on function public.delete_my_account() from public,anon;
grant execute on function public.delete_my_account() to authenticated;
commit;
