import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import test from "node:test";
import assert from "node:assert/strict";
const userA = "11111111-1111-4111-8111-111111111111",
  userB = "22222222-2222-4222-8222-222222222222";
test("Supabase schema is repeatable; RLS isolates profiles and protects currency/rewards", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb not null default '{}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;`,
    );
    const migration = await readFile(
      new URL("../supabase/001_rope_skipping.sql", import.meta.url),
      "utf8",
    );
    await db.exec(migration);
    await db.exec(migration);
    await db.query(
      "insert into auth.users(id,raw_user_meta_data) values($1,$2),($3,$4)",
      [
        userA,
        { display_name: "MoFunk", avatar: "pink" },
        userB,
        { display_name: "Other Player", avatar: "blue" },
      ],
    );
    assert.equal(
      (
        await db.query(
          "select coins from public.player_wallets where user_id=$1",
          [userA],
        )
      ).rows[0].coins,
      2450,
    );
    assert.equal(
      (
        await db.query(
          "select count(*)::int as n from public.player_looks where user_id=$1",
          [userA],
        )
      ).rows[0].n,
      3,
    );
    await db.exec("set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      userA,
    ]);
    const profiles = await db.query("select * from public.profiles");
    assert.equal(profiles.rows.length, 1);
    assert.equal(profiles.rows[0].display_name, "MoFunk");
    await db.query(
      "insert into public.profiles(id,display_name,avatar) values($1,$2,$3) on conflict(id) do update set id=excluded.id,display_name=excluded.display_name,avatar=excluded.avatar",
      [userA, "MoFunk Crew", "yellow"],
    );
    assert.equal(
      (await db.query("select display_name from public.profiles")).rows[0]
        .display_name,
      "MoFunk Crew",
    );
    assert.equal(
      (
        await db.query(
          "update public.profiles set display_name=$1 where id=$2 returning id",
          ["Hacked", userB],
        )
      ).rows.length,
      0,
    );
    await assert.rejects(
      db.query("update public.player_wallets set coins=999999"),
      /permission denied/,
    );
    await assert.rejects(
      db.query(
        "update public.player_looks set outfit_id='outfit5' where crew='pink'",
      ),
      /row-level security/,
    );
    const buy = await db.query(
      "select public.purchase_cosmetic('outfit1') as receipt",
    );
    assert.equal(buy.rows[0].receipt.coins, 1650);
    const retry = await db.query(
      "select public.purchase_cosmetic('outfit1') as receipt",
    );
    assert.equal(retry.rows[0].receipt.already_owned, true);
    assert.equal(retry.rows[0].receipt.coins, 1650);
    await db.query(
      "update public.player_looks set outfit_id='outfit1' where crew='pink'",
    );
    const request = "33333333-3333-4333-8333-333333333333";
    const match = (
      await db.query("select public.start_game_match('cpu','Hard',$1) as id", [
        request,
      ])
    ).rows[0].id;
    assert.equal(
      (
        await db.query(
          "select public.start_game_match('cpu','Hard',$1) as id",
          [request],
        )
      ).rows[0].id,
      match,
    );
    assert.equal(
      (
        await db.query(
          "select display_name from public.match_participants where slot=1 and match_id=$1",
          [match],
        )
      ).rows[0].display_name,
      "BeatBot",
    );
    await assert.rejects(
      db.query("select public.award_verified_match($1)", [match]),
      /permission denied/,
    );
    await assert.rejects(
      db.query(
        "update public.game_matches set status='complete',winner=0,finished_at=now(),verified_at=now() where id=$1",
        [match],
      ),
      /permission denied/,
    );
    await db.exec("reset role;set role service_role");
    await assert.rejects(
      db.query("select public.award_verified_match($1)", [match]),
      /verified completed match/,
    );
    await db.query(
      "update public.game_matches set status='complete',winner=0,finished_at=now(),verified_at=now(),verified_best_streak=8 where id=$1",
      [match],
    );
    const award = (
      await db.query("select public.award_verified_match($1) as receipt", [
        match,
      ])
    ).rows[0].receipt;
    assert.equal(award.coins, 1900);
    assert.equal(award.xp_earned, 50);
    const again = (
      await db.query("select public.award_verified_match($1) as receipt", [
        match,
      ])
    ).rows[0].receipt;
    assert.equal(again.already_awarded, true);
    assert.equal(again.coins, 1900);
    const stats = (
      await db.query("select * from public.player_stats where user_id=$1", [
        userA,
      ])
    ).rows[0];
    assert.equal(stats.wins, 1);
    assert.equal(stats.matches_played, 1);
    assert.equal(stats.best_streak, 8);
    await db.exec("reset role");
    await db.exec(migration);
    assert.equal(
      (
        await db.query(
          "select coins from public.player_wallets where user_id=$1",
          [userA],
        )
      ).rows[0].coins,
      1900,
      "rerunning migration must not reset coins",
    );
  } finally {
    await db.close();
  }
});
