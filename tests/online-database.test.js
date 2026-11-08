import test from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
const A = "11111111-1111-4111-8111-111111111111",
  B = "22222222-2222-4222-8222-222222222222",
  C = "33333333-3333-4333-8333-333333333333";
test("online escrow, server scoring, public leaderboard and gallery policies are isolated and idempotent", async () => {
  const db = new PGlite();
  const as = async (id) => {
    await db.exec("reset role;set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  };
  const admin = () => db.exec("reset role");
  const rpc = async (sql, args = []) =>
    (await db.query(sql, args)).rows[0]?.result;
  try {
    await db.exec(
      `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated,service_role;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;grant usage on schema storage to authenticated;grant select,insert,update,delete on storage.objects to authenticated;create function storage.foldername(text) returns text[] language sql immutable as $$select (string_to_array($1,'/'))[1:array_length(string_to_array($1,'/'),1)-1]$$;`,
    );
    for (const file of [
      "001_rope_skipping.sql",
      "002_social_and_points.sql",
      "003_online_challenges.sql",
      "004_avatar_storage.sql",
      "005_progress_and_deletion.sql",
    ])
      await db.exec(
        await readFile(new URL("../supabase/" + file, import.meta.url), "utf8"),
      );
    await db.exec(
      await readFile(
        new URL("../supabase/002_social_and_points.sql", import.meta.url),
        "utf8",
      ),
    );
    await db.exec(
      await readFile(
        new URL("../supabase/003_online_challenges.sql", import.meta.url),
        "utf8",
      ),
    );
    await db.query("insert into auth.users(id) values($1),($2),($3)", [
      A,
      B,
      C,
    ]);
    await as(A);
    let wallet = await rpc("select public.get_my_points() as result");
    assert.equal(wallet.points, 1000);
    wallet = await rpc("select public.buy_freeze($1) as result", [
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    ]);
    assert.equal(wallet.points, 950);
    assert.equal(wallet.freeze_tokens, 1);
    wallet = await rpc("select public.buy_freeze($1) as result", [
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    ]);
    assert.equal(wallet.points, 950);
    wallet = await rpc("select public.claim_daily_points() as result");
    assert.equal(wallet.points, 1050);
    wallet = await rpc("select public.claim_daily_points() as result");
    assert.equal(wallet.claimed, false);
    await assert.rejects(
      db.exec("update public.challenge_wallets set points=999999"),
      /permission denied/,
    );
    await db.query(
      "update public.profiles set username=$1,country_code=$2,photo_path=$3 where id=$4",
      ["mofunk", "ZA", A + "/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.webp", A],
    );
    await db.query(
      "insert into storage.objects(bucket_id,name) values($1,$2)",
      ["player-avatars", A + "/picture.webp"],
    );
    await assert.rejects(
      db.query("insert into storage.objects(bucket_id,name) values($1,$2)", [
        "player-avatars",
        B + "/picture.webp",
      ]),
      /row-level security/,
    );
    await assert.rejects(
      db.query("update public.profiles set photo_path=$1 where id=$2", [
        B + "/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.webp",
        A,
      ]),
      /check constraint/,
    );
    const request = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    let room = await rpc("select public.create_challenge($1,$2) as result", [
      100,
      request,
    ]);
    const id = room.room_id,
      code = room.invite_code;
    assert.equal(room.wallet.points, 950);
    room = await rpc("select public.create_challenge($1,$2) as result", [
      100,
      request,
    ]);
    assert.equal(room.wallet.points, 950);
    await as(C);
    await assert.rejects(
      db.query("select public.challenge_action($1,$2,$3)", [
        id,
        "poll",
        "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      ]),
      /access denied/,
    );
    await as(B);
    let preview = await rpc("select public.preview_challenge($1) as result", [
      code,
    ]);
    assert.equal(preview.pot, 200);
    room = await rpc("select public.accept_challenge($1) as result", [code]);
    assert.equal(room.wallet.points, 900);
    assert.equal(room.status, "active");
    room = await rpc("select public.accept_challenge($1) as result", [code]);
    assert.equal(room.wallet.points, 900);
    await assert.rejects(
      db.query("update public.challenge_rooms set state=$1 where id=$2", [
        {},
        id,
      ]),
      /permission denied/,
    );
    await assert.rejects(
      db.query("select public.rsc_finish_challenge($1,1)", [id]),
      /permission denied/,
    );
    await as(A);
    await rpc("select public.challenge_action($1,$2,$3) as result", [
      id,
      "roll",
      "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    ]);
    await admin();
    await db.query(
      "update public.challenge_rooms set state=state||jsonb_build_object('state','skipping','period_ms',1900,'next_crossing',extract(epoch from clock_timestamp())*1000+1800) where id=$1",
      [id],
    );
    await as(A);
    room = await rpc("select public.challenge_action($1,$2,$3) as result", [
      id,
      "jump",
      "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    ]);
    await assert.rejects(
      db.query("select public.challenge_action($1,$2,$3)", [
        id,
        "jump",
        "ffffffff-ffff-4fff-8fff-ffffffffffff",
      ]),
      /airborne/,
    );
    await admin();
    await db.query(
      "update public.challenge_rooms set state=state||jsonb_build_object('state','skipping','progress',jsonb_build_array(99,0),'needed',1,'done',0,'jump_at',extract(epoch from clock_timestamp())*1000-380,'next_crossing',extract(epoch from clock_timestamp())*1000-1) where id=$1",
      [id],
    );
    await as(A);
    room = await rpc("select public.challenge_action($1,$2,$3) as result", [
      id,
      "poll",
      "12345678-1234-4234-8234-123456789012",
    ]);
    assert.equal(room.status, "complete");
    assert.equal(room.winner, 0);
    assert.equal(room.wallet.points, 1150);
    room = await rpc("select public.challenge_action($1,$2,$3) as result", [
      id,
      "poll",
      "12345678-1234-4234-8234-123456789012",
    ]);
    assert.equal(room.wallet.points, 1150, "payout only once");
    let pending = await rpc("select public.create_challenge($1,$2) as result", [
      50,
      "12345678-1234-4234-8234-123456789013",
    ]);
    pending = await rpc("select public.challenge_action($1,$2,$3) as result", [
      pending.room_id,
      "cancel",
      "12345678-1234-4234-8234-123456789014",
    ]);
    assert.equal(pending.wallet.points, 1150);
    assert.equal(pending.status, "cancelled");
    await db.query("insert into public.practice_progress(user_id,save) values($1,$2)",[A,{wins:52}]);
    await as(B);
    assert.equal((await db.query("select * from public.practice_progress")).rows.length,0);
    await assert.rejects(db.query("insert into public.practice_progress(user_id,save) values($1,$2)",[A,{wins:999}]),/row-level security/);
    await as(C);
    const open=await rpc("select public.create_challenge(10,gen_random_uuid()) as result");
    await assert.rejects(db.exec("select public.delete_my_account()"),/Finish or cancel/);
    await rpc("select public.challenge_action($1,'cancel',gen_random_uuid()) as result",[open.room_id]);
    await db.exec("select public.delete_my_account()");
    await admin();
    assert.equal((await db.query("select id from auth.users where id=$1",[C])).rows.length,0);
    await db.exec("reset role;set role anon");
    const board = (await db.query("select * from public.get_leaderboard(100)"))
      .rows;
    assert.equal(board.length, 2);
    assert.equal(board[0].username, "mofunk");
    assert.equal(board[0].country_code, "ZA");
    assert.equal("email" in board[0], false);
  } finally {
    await db.close();
  }
});
