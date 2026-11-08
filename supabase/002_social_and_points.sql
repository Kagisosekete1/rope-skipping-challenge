-- Apply AFTER 001_rope_skipping.sql. Play points have no cash value.
begin;
alter table public.profiles add column if not exists username text not null default ('player_'||substr(replace(gen_random_uuid()::text,'-',''),1,12));
alter table public.profiles add column if not exists country_code text not null default '';
alter table public.profiles add column if not exists photo_path text;
alter table public.profiles add column if not exists leaderboard_visible boolean not null default true;
create unique index if not exists rsc_username_unique on public.profiles(lower(username));
do $$begin
 if not exists(select 1 from pg_constraint where conname='rsc_username_format') then alter table public.profiles add constraint rsc_username_format check(username ~ '^[a-zA-Z0-9_]{3,24}$');end if;
 if not exists(select 1 from pg_constraint where conname='rsc_country_format') then alter table public.profiles add constraint rsc_country_format check(country_code='' or country_code ~ '^[A-Z]{2}$');end if;
 if not exists(select 1 from pg_constraint where conname='rsc_photo_owner') then alter table public.profiles add constraint rsc_photo_owner check(photo_path is null or photo_path ~ ('^'||id::text||'/[a-f0-9-]+\.(webp|jpg|png)$'));end if;
end;$$;
grant insert(username,country_code,photo_path,leaderboard_visible),update(username,country_code,photo_path,leaderboard_visible) on public.profiles to authenticated;

create table if not exists public.challenge_wallets(
 user_id uuid primary key references public.profiles(id) on delete cascade,
 points bigint not null default 1000 check(points between 0 and 9007199254740991),
 lifetime_earned bigint not null default 1000 check(lifetime_earned>=0),
 online_wins integer not null default 0 check(online_wins>=0),
 freeze_tokens integer not null default 0 check(freeze_tokens>=0),updated_at timestamptz not null default now()
);
create table if not exists public.points_ledger(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,
 delta bigint not null,reason text not null,request_key text not null,created_at timestamptz not null default now(),unique(user_id,request_key)
);
alter table public.challenge_wallets enable row level security;
alter table public.points_ledger enable row level security;
revoke all on public.challenge_wallets,public.points_ledger from anon,authenticated;
grant select on public.challenge_wallets,public.points_ledger to authenticated;
grant all on public.challenge_wallets,public.points_ledger to service_role;
drop policy if exists rsc_points_own on public.challenge_wallets;
create policy rsc_points_own on public.challenge_wallets for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists rsc_points_history on public.points_ledger;
create policy rsc_points_history on public.points_ledger for select to authenticated using(user_id=(select auth.uid()));
create or replace function public.rsc_initialize_points(p_user uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$begin
 insert into public.challenge_wallets(user_id) values(p_user) on conflict do nothing;
 insert into public.points_ledger(user_id,delta,reason,request_key) values(p_user,1000,'Starter play points','starter-v1') on conflict do nothing;
end;$$;
revoke all on function public.rsc_initialize_points(uuid) from public,anon,authenticated;
create or replace function public.rsc_new_auth_user() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$begin
 perform public.rsc_initialize_player(new.id,new.raw_user_meta_data->>'display_name',new.raw_user_meta_data->>'avatar');
 perform public.rsc_initialize_points(new.id);return new;end;$$;
select public.rsc_initialize_points(id) from public.profiles;

create or replace function public.get_my_points() returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$declare w public.challenge_wallets%rowtype;begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 select * into w from public.challenge_wallets where user_id=auth.uid();
 return jsonb_build_object('points',w.points,'freeze_tokens',w.freeze_tokens,'online_wins',w.online_wins);
end;$$;
create or replace function public.buy_freeze(p_request_id uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$declare u uuid=auth.uid();w public.challenge_wallets%rowtype;begin
 if u is null then raise exception 'Sign in required';end if;
 select * into w from public.challenge_wallets where user_id=u for update;
 if not found then raise exception 'Points wallet unavailable';end if;
 if exists(select 1 from public.points_ledger where user_id=u and request_key='freeze-buy:'||p_request_id) then return public.get_my_points();end if;
 if w.points<50 then raise exception 'Freeze costs 50 points';end if;
 update public.challenge_wallets set points=points-50,freeze_tokens=freeze_tokens+1,updated_at=now() where user_id=u;
 insert into public.points_ledger(user_id,delta,reason,request_key) values(u,-50,'Freeze token','freeze-buy:'||p_request_id);
 return public.get_my_points();end;$$;
create or replace function public.consume_practice_freeze(p_request_id uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$declare u uuid=auth.uid();w public.challenge_wallets%rowtype;begin
 if u is null then raise exception 'Sign in required';end if;
 select * into w from public.challenge_wallets where user_id=u for update;
 if exists(select 1 from public.points_ledger where user_id=u and request_key='freeze-use:'||p_request_id) then return public.get_my_points();end if;
 if w.freeze_tokens<1 then raise exception 'Buy a Freeze token first';end if;
 update public.challenge_wallets set freeze_tokens=freeze_tokens-1 where user_id=u;
 insert into public.points_ledger(user_id,delta,reason,request_key) values(u,0,'Practice Freeze used','freeze-use:'||p_request_id);
 return public.get_my_points();end;$$;
create or replace function public.claim_daily_points() returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$declare u uuid=auth.uid();entry uuid;begin
 if u is null then raise exception 'Sign in required';end if;
 perform 1 from public.challenge_wallets where user_id=u for update;
 insert into public.points_ledger(user_id,delta,reason,request_key) values(u,100,'Daily play points','daily:'||to_char(now() at time zone 'UTC','YYYY-MM-DD')) on conflict do nothing returning id into entry;
 if entry is not null then update public.challenge_wallets set points=points+100,lifetime_earned=lifetime_earned+100 where user_id=u;end if;
 return public.get_my_points()||jsonb_build_object('claimed',entry is not null);end;$$;
revoke all on function public.get_my_points(),public.buy_freeze(uuid),public.consume_practice_freeze(uuid),public.claim_daily_points() from public,anon;
grant execute on function public.get_my_points(),public.buy_freeze(uuid),public.consume_practice_freeze(uuid),public.claim_daily_points() to authenticated;

create or replace function public.get_leaderboard(p_limit integer default 100)
 returns table(rank bigint,username text,display_name text,avatar text,photo_path text,country_code text,points bigint,wins integer)
 language sql stable security definer set search_path=public,pg_temp as $$
 select row_number() over(order by w.points desc,w.online_wins desc,p.username),p.username,p.display_name,p.avatar,p.photo_path,p.country_code,w.points,w.online_wins
 from public.profiles p join public.challenge_wallets w on w.user_id=p.id where p.leaderboard_visible
 order by w.points desc,w.online_wins desc,p.username limit greatest(1,least(coalesce(p_limit,100),100));$$;
revoke all on function public.get_leaderboard(integer) from public;
grant execute on function public.get_leaderboard(integer) to anon,authenticated;
commit;
