-- Rope Skipping Challenge: fresh-project schema, repeatable seed data and RLS.
-- Run in the Supabase SQL Editor as the project owner. Never run in the browser.
-- Supabase Auth owns accounts/passwords; this script never stores passwords.
begin;

create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default 'Player 1' check (char_length(btrim(display_name)) between 2 and 24),
 avatar text not null default 'pink' check (avatar in ('pink','blue','yellow')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.shop_catalog (
 id text primary key, category text not null check (category in ('outfit','hair','shoes','rope')),
 name text not null, color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
 price integer not null check (price >= 0), sort_order integer not null default 0,
 active boolean not null default true
);
create table if not exists public.music_tracks (
 id text primary key, title text not null, asset_path text not null,
 duration_seconds integer not null check (duration_seconds > 0),
 sort_order integer not null default 0, active boolean not null default true
);
create table if not exists public.player_settings (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 sound_enabled boolean not null default true, music_enabled boolean not null default true,
 music_volume numeric(3,2) not null default 0.40 check (music_volume between 0 and 1),
 graphics_quality text not null default 'auto' check (graphics_quality in ('auto','high','low')),
 rope_id text not null default 'rope0' references public.shop_catalog(id),
 favorite_track_id text references public.music_tracks(id) on delete set null,
 updated_at timestamptz not null default now()
);
create table if not exists public.player_wallets (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 coins bigint not null default 2450 check (coins >= 0), xp bigint not null default 0 check (xp >= 0),
 updated_at timestamptz not null default now()
);
create table if not exists public.player_stats (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 matches_played integer not null default 0 check (matches_played >= 0),
 wins integer not null default 0 check (wins >= 0 and wins <= matches_played),
 best_streak integer not null default 0 check (best_streak >= 0),
 rank_points integer not null default 0 check (rank_points >= 0),
 updated_at timestamptz not null default now()
);
create table if not exists public.owned_cosmetics (
 user_id uuid not null references public.profiles(id) on delete cascade,
 item_id text not null references public.shop_catalog(id),
 paid_coins integer not null default 0 check (paid_coins >= 0),
 acquired_at timestamptz not null default now(), primary key (user_id,item_id)
);
create table if not exists public.player_looks (
 user_id uuid not null references public.profiles(id) on delete cascade,
 crew text not null check (crew in ('pink','blue','yellow')),
 outfit_id text not null references public.shop_catalog(id),
 hair_id text not null references public.shop_catalog(id),
 shoes_id text not null references public.shop_catalog(id),
 skin_tone smallint not null default 2 check (skin_tone between 0 and 4),
 hairstyle smallint not null default 0 check (hairstyle between 0 and 2),
 updated_at timestamptz not null default now(), primary key (user_id,crew)
);
create table if not exists public.game_matches (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references public.profiles(id) on delete cascade,
 client_request_id uuid not null default gen_random_uuid(),
 mode text not null check (mode in ('cpu','pvp')),
 difficulty text not null default 'Normal' check (difficulty in ('Easy','Normal','Hard')),
 status text not null default 'active' check (status in ('active','complete','abandoned')),
 winner smallint check (winner in (0,1)),
 verified_best_streak integer not null default 0 check (verified_best_streak between 0 and 1000),
 started_at timestamptz not null default now(), finished_at timestamptz,
 verified_at timestamptz, rewarded_at timestamptz,
 unique(owner_id,client_request_id),
 check (status <> 'complete' or (winner is not null and finished_at is not null))
);
create table if not exists public.match_participants (
 match_id uuid not null references public.game_matches(id) on delete cascade,
 slot smallint not null check (slot in (0,1)),
 user_id uuid references public.profiles(id) on delete set null,
 participant_kind text not null check (participant_kind in ('human','guest','computer')),
 display_name text not null check (char_length(display_name) between 1 and 24),
 progress integer not null default 0 check (progress between 0 and 100),
 successful_jumps integer not null default 0 check (successful_jumps >= 0),
 perfect_jumps integer not null default 0 check (perfect_jumps between 0 and successful_jumps),
 primary key (match_id,slot)
);
create table if not exists public.reward_ledger (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 match_id uuid references public.game_matches(id) on delete set null,
 item_id text references public.shop_catalog(id),
 entry_type text not null check (entry_type in ('starter','purchase','match_reward')),
 coin_delta bigint not null, xp_delta integer not null default 0 check (xp_delta >= 0),
 dedupe_key text not null, created_at timestamptz not null default now(),
 unique(user_id,dedupe_key)
);
create index if not exists rsc_matches_owner_started on public.game_matches(owner_id,started_at desc);
create index if not exists rsc_ledger_user_created on public.reward_ledger(user_id,created_at desc);
create index if not exists rsc_participant_user on public.match_participants(user_id) where user_id is not null;

insert into public.shop_catalog(id,category,name,color,price,sort_order) values
 ('outfit0','outfit','Bubblegum','#fc278b',0,0),('outfit1','outfit','Electric blue','#087ff6',800,1),
 ('outfit2','outfit','Sunshine','#ffcb13',1000,2),('outfit3','outfit','Cherry','#ff383b',1200,3),
 ('outfit4','outfit','Grape','#a934ed',1200,4),('outfit5','outfit','Lime','#54da22',1500,5),
 ('outfit6','outfit','Ice blue','#c8f2ff',1500,6),('outfit7','outfit','Tangerine','#ff8510',1800,7),
 ('hair0','hair','Chestnut','#3b1c10',0,0),('hair1','hair','Midnight','#161014',600,1),('hair2','hair','Copper','#9c431d',800,2),
 ('shoes0','shoes','Pink high-tops','#fc278b',0,0),('shoes1','shoes','Blue high-tops','#087ff6',500,1),('shoes2','shoes','Golden high-tops','#ffcb13',700,2),
 ('rope0','rope','Golden twist','#ffd128',0,0),('rope1','rope','Candy swirl','#ff40c7',600,1),('rope2','rope','Arctic blue','#30dfff',900,2)
 on conflict(id) do update set category=excluded.category,name=excluded.name,color=excluded.color,price=excluded.price,sort_order=excluded.sort_order;
insert into public.music_tracks(id,title,asset_path,duration_seconds,sort_order) values
 ('rope-rush','Rope Rush','music/rope-rush.mp3',117,0),('rope-rush-1','Rope Rush 1','music/rope-rush-1.mp3',93,1),
 ('rope-rush-2','Rope Rush 2','music/rope-rush-2.mp3',122,2),('rope-rush-3','Rope Rush 3','music/rope-rush-3.mp3',113,3),
 ('rope-rush-4','Rope Rush 4','music/rope-rush-4.mp3',120,4)
 on conflict(id) do update set title=excluded.title,asset_path=excluded.asset_path,duration_seconds=excluded.duration_seconds,sort_order=excluded.sort_order;

create or replace function public.rsc_touch_updated_at() returns trigger language plpgsql set search_path=public,pg_temp as $$
 begin new.updated_at=now();return new;end;$$;
do $$declare t text;begin
 foreach t in array array['profiles','player_settings','player_wallets','player_stats','player_looks'] loop
 execute format('drop trigger if exists rsc_updated_at on public.%I',t);
 execute format('create trigger rsc_updated_at before update on public.%I for each row execute function public.rsc_touch_updated_at()',t);
 end loop;end;$$;

-- One initializer is shared by new-account signup and the existing-user backfill.
create or replace function public.rsc_initialize_player(p_user uuid,p_name text default 'Player 1',p_avatar text default 'pink')
 returns void language plpgsql security definer set search_path=public,pg_temp as $$
 declare v_name text;begin
 v_name=left(btrim(regexp_replace(coalesce(p_name,''),'\s+',' ','g')),24);
 if char_length(v_name)<2 then v_name='Player 1';end if;
 insert into public.profiles(id,display_name,avatar) values(p_user,v_name,case when p_avatar in ('pink','blue','yellow') then p_avatar else 'pink' end) on conflict(id) do nothing;
 insert into public.player_wallets(user_id) values(p_user) on conflict do nothing;
 insert into public.player_stats(user_id) values(p_user) on conflict do nothing;
 insert into public.player_settings(user_id) values(p_user) on conflict do nothing;
 insert into public.owned_cosmetics(user_id,item_id) select p_user,x from unnest(array['outfit0','hair0','shoes0','rope0']) as x on conflict do nothing;
 insert into public.player_looks(user_id,crew,outfit_id,hair_id,shoes_id,skin_tone) values
 (p_user,'pink','outfit0','hair0','shoes0',2),(p_user,'blue','outfit1','hair1','shoes1',3),(p_user,'yellow','outfit2','hair0','shoes2',2) on conflict do nothing;
 insert into public.reward_ledger(user_id,entry_type,coin_delta,xp_delta,dedupe_key) values(p_user,'starter',2450,0,'starter-v1') on conflict do nothing;
 end;$$;
revoke all on function public.rsc_initialize_player(uuid,text,text) from public,anon,authenticated;
create or replace function public.rsc_new_auth_user() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
 begin perform public.rsc_initialize_player(new.id,new.raw_user_meta_data->>'display_name',new.raw_user_meta_data->>'avatar');return new;end;$$;
revoke all on function public.rsc_new_auth_user() from public,anon,authenticated;
drop trigger if exists rsc_create_player on auth.users;
create trigger rsc_create_player after insert on auth.users for each row execute function public.rsc_new_auth_user();
select public.rsc_initialize_player(id,raw_user_meta_data->>'display_name',raw_user_meta_data->>'avatar') from auth.users;

-- Row-level security is enabled on every application table.
alter table public.profiles enable row level security;
alter table public.shop_catalog enable row level security;
alter table public.music_tracks enable row level security;
alter table public.player_settings enable row level security;
alter table public.player_wallets enable row level security;
alter table public.player_stats enable row level security;
alter table public.owned_cosmetics enable row level security;
alter table public.player_looks enable row level security;
alter table public.game_matches enable row level security;
alter table public.match_participants enable row level security;
alter table public.reward_ledger enable row level security;

revoke all on public.profiles,public.shop_catalog,public.music_tracks,public.player_settings,public.player_wallets,public.player_stats,public.owned_cosmetics,public.player_looks,public.game_matches,public.match_participants,public.reward_ledger from anon,authenticated;
grant usage on schema public to anon,authenticated;
grant select on public.shop_catalog,public.music_tracks to anon,authenticated;
grant select on public.profiles,public.player_settings,public.player_wallets,public.player_stats,public.owned_cosmetics,public.player_looks,public.game_matches,public.match_participants,public.reward_ledger to authenticated;
grant insert(id,display_name,avatar),update(id,display_name,avatar) on public.profiles to authenticated;
grant insert,update on public.player_settings,public.player_looks to authenticated;
grant all on public.profiles,public.shop_catalog,public.music_tracks,public.player_settings,public.player_wallets,public.player_stats,public.owned_cosmetics,public.player_looks,public.game_matches,public.match_participants,public.reward_ledger to service_role;

drop policy if exists rsc_catalog_read on public.shop_catalog;
create policy rsc_catalog_read on public.shop_catalog for select to anon,authenticated using(active);
drop policy if exists rsc_music_read on public.music_tracks;
create policy rsc_music_read on public.music_tracks for select to anon,authenticated using(active);
drop policy if exists rsc_profile_read on public.profiles;
create policy rsc_profile_read on public.profiles for select to authenticated using(id=(select auth.uid()));
drop policy if exists rsc_profile_insert on public.profiles;
create policy rsc_profile_insert on public.profiles for insert to authenticated with check(id=(select auth.uid()));
drop policy if exists rsc_profile_update on public.profiles;
create policy rsc_profile_update on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));

do $$declare t text;begin
 foreach t in array array['player_settings','player_wallets','player_stats','owned_cosmetics','player_looks','reward_ledger'] loop
 execute format('drop policy if exists rsc_own_read on public.%I',t);
 execute format('create policy rsc_own_read on public.%I for select to authenticated using(user_id=(select auth.uid()))',t);
 end loop;end;$$;
drop policy if exists rsc_settings_write on public.player_settings;
create policy rsc_settings_write on public.player_settings for all to authenticated
 using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()) and exists(select 1 from public.shop_catalog c where c.id=rope_id and c.category='rope') and exists(select 1 from public.owned_cosmetics o where o.user_id=(select auth.uid()) and o.item_id=rope_id));

-- Cosmetic writes require the correct item category and an owned item or the crew's default.
create or replace function public.rsc_can_equip(p_crew text,p_outfit text,p_hair text,p_shoes text)
 returns boolean language sql stable security invoker set search_path=public,pg_temp as $$
 select auth.uid() is not null
 and exists(select 1 from public.shop_catalog where id=p_outfit and category='outfit')
 and exists(select 1 from public.shop_catalog where id=p_hair and category='hair')
 and exists(select 1 from public.shop_catalog where id=p_shoes and category='shoes')
 and (p_outfit=case p_crew when 'pink' then 'outfit0' when 'blue' then 'outfit1' when 'yellow' then 'outfit2' end or exists(select 1 from public.owned_cosmetics where user_id=auth.uid() and item_id=p_outfit))
 and (p_hair=case p_crew when 'blue' then 'hair1' else 'hair0' end or exists(select 1 from public.owned_cosmetics where user_id=auth.uid() and item_id=p_hair))
 and (p_shoes=case p_crew when 'pink' then 'shoes0' when 'blue' then 'shoes1' when 'yellow' then 'shoes2' end or exists(select 1 from public.owned_cosmetics where user_id=auth.uid() and item_id=p_shoes));$$;
revoke all on function public.rsc_can_equip(text,text,text,text) from public,anon;
grant execute on function public.rsc_can_equip(text,text,text,text) to authenticated;
drop policy if exists rsc_looks_write on public.player_looks;
create policy rsc_looks_write on public.player_looks for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()) and public.rsc_can_equip(crew,outfit_id,hair_id,shoes_id));
drop policy if exists rsc_matches_read on public.game_matches;
create policy rsc_matches_read on public.game_matches for select to authenticated using(owner_id=(select auth.uid()));
drop policy if exists rsc_participants_read on public.match_participants;
create policy rsc_participants_read on public.match_participants for select to authenticated using(exists(select 1 from public.game_matches m where m.id=match_id and m.owner_id=(select auth.uid())));

-- Price lookup and wallet lock happen in one transaction; retries cannot charge twice.
create or replace function public.purchase_cosmetic(p_item_id text) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
 declare u uuid=auth.uid();cost integer;balance bigint;begin
 if u is null then raise exception 'Sign in required';end if;
 select price into cost from public.shop_catalog where id=p_item_id and active;
 if not found then raise exception 'Item unavailable';end if;
 select coins into balance from public.player_wallets where user_id=u for update;
 if not found then raise exception 'Player wallet not initialized';end if;
 if exists(select 1 from public.owned_cosmetics where user_id=u and item_id=p_item_id) then return jsonb_build_object('item_id',p_item_id,'coins',balance,'already_owned',true);end if;
 if balance<cost then raise exception 'Not enough coins';end if;
 update public.player_wallets set coins=coins-cost where user_id=u returning coins into balance;
 insert into public.owned_cosmetics(user_id,item_id,paid_coins) values(u,p_item_id,cost);
 insert into public.reward_ledger(user_id,item_id,entry_type,coin_delta,dedupe_key) values(u,p_item_id,'purchase',-cost,'purchase:'||p_item_id);
 return jsonb_build_object('item_id',p_item_id,'coins',balance,'already_owned',false);
 end;$$;
revoke all on function public.purchase_cosmetic(text) from public,anon;
grant execute on function public.purchase_cosmetic(text) to authenticated;

create or replace function public.start_game_match(p_mode text,p_difficulty text default 'Normal',p_request_id uuid default gen_random_uuid()) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
 declare u uuid=auth.uid();m uuid;n text;begin
 if u is null then raise exception 'Sign in required';end if;
 if p_mode not in ('cpu','pvp') or p_difficulty not in ('Easy','Normal','Hard') then raise exception 'Invalid match options';end if;
 select display_name into n from public.profiles where id=u;if not found then raise exception 'Player profile not initialized';end if;
 insert into public.game_matches(owner_id,mode,difficulty,client_request_id) values(u,p_mode,p_difficulty,p_request_id) on conflict(owner_id,client_request_id) do nothing returning id into m;
 if m is null then select id into m from public.game_matches where owner_id=u and client_request_id=p_request_id;return m;end if;
 insert into public.match_participants(match_id,slot,user_id,participant_kind,display_name) values(m,0,u,'human',n),(m,1,null,case when p_mode='cpu' then 'computer' else 'guest' end,case when p_mode='cpu' then 'BeatBot' else 'Player 2' end);
 return m;end;$$;
revoke all on function public.start_game_match(text,text,uuid) from public,anon;
grant execute on function public.start_game_match(text,text,uuid) to authenticated;

-- Trusted server only: do not grant this function to browsers. The server must
-- validate actual gameplay and set verified_at; client-reported wins are untrusted.
create or replace function public.award_verified_match(p_match_id uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
 declare m public.game_matches%rowtype;c integer;x integer;balance bigint;entry uuid;begin
 select * into m from public.game_matches where id=p_match_id for update;
 if not found or m.status<>'complete' or m.verified_at is null then raise exception 'A verified completed match is required';end if;
 select coins into balance from public.player_wallets where user_id=m.owner_id for update;
 if m.rewarded_at is not null then return jsonb_build_object('coins',balance,'already_awarded',true);end if;
 c=case when m.mode='pvp' then 200 when m.winner=0 then 250 else 80 end;x=case when m.winner=0 then 50 else 20 end;
 insert into public.reward_ledger(user_id,match_id,entry_type,coin_delta,xp_delta,dedupe_key) values(m.owner_id,m.id,'match_reward',c,x,'match:'||m.id::text) on conflict(user_id,dedupe_key) do nothing returning id into entry;
 if entry is not null then
 update public.player_wallets set coins=coins+c,xp=xp+x where user_id=m.owner_id returning coins into balance;
 update public.player_stats set matches_played=matches_played+1,wins=wins+case when m.winner=0 then 1 else 0 end,best_streak=greatest(best_streak,m.verified_best_streak),rank_points=greatest(0,rank_points+case when m.mode='pvp' then 0 when m.winner=0 then 30 else -10 end) where user_id=m.owner_id;
 end if;
 update public.game_matches set rewarded_at=now() where id=m.id;
 return jsonb_build_object('coins',balance,'coins_earned',c,'xp_earned',x,'already_awarded',entry is null);
 end;$$;
revoke all on function public.award_verified_match(uuid) from public,anon,authenticated;
grant execute on function public.award_verified_match(uuid) to service_role;
commit;
