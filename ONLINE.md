# Profiles, powers and online points

Apply `supabase/upgrade-2.2.sql` after the existing 001 schema. It contains append-only migrations 002–004: social profiles and points, online challenges, and an owner-controlled photo storage bucket. Do not rerun the original 001 migration after later migrations; later changes extend its signup trigger.

## Profiles and public rankings

Profile supports a unique 3–24-character username, country, crew avatar and gallery photo. Gallery images are cropped/re-encoded to 512px and must be JPG/PNG/WebP; image upload is limited to an authenticated user's UUID folder. The bucket is public because photos appear on the public leaderboard. A profile can opt out of leaderboard listing. Emails and passwords never appear in the leaderboard RPC.

The public board displays the top 100 listed accounts by available challenge points, then online wins. Local practice saves are never uploaded as trusted point balances.

## Point currency

Challenge points have no cash value, cannot be bought with money and cannot be cashed out. Each account receives 1,000 starter points once. A daily server-time claim gives 100 points once per UTC date. Points wallets and the ledger are read-only to browsers. RPCs control spends, holds, refunds and payouts.

Local guest practice has its own device-only points/tokens. Existing cosmetic coins and solo progress remain device-local. They cannot be used to create a cloud stake or improve the public leaderboard.

## Power-ups

- Block: one charge per player per match; counters the next incoming Freeze.
- Shield: one charge; absorbs one missed rope crossing without ending the turn.
- Slow: one charge; slows the rope for the current turn. In online play activate it while the rope is moving.
- Boost: one charge; doubles the next successful jump's progress.
- Freeze: costs 50 points per purchased token. Using a token disables the opponent's jump input for 1.5 seconds and cancels their current jump. It can target BeatBot, the other same-device player, or an online opponent during their skipping turn. Block can consume/counter it; Shield can protect a resulting miss.

In same-device two-player mode, the P1/P2 tools switch chooses which player's powers are being used. Online tools belong to the signed-in player only.

## Online matches

1. Sign in and open Invite a Friend.
2. Choose a positive whole-number stake within your available points. Creating an invitation places the host's stake in escrow.
3. Share the invitation link/code. The friend previews the amount and explicitly accepts the same stake; their points are then held too.
4. Both clients show the same server-controlled turn state. Rolls, jump cooldowns, crossing times, Freeze and scoring are evaluated using the PostgreSQL server clock. Clients submit actions, not percentages or winner IDs.
5. First to 100% wins the full two-player pot, with no fee. A 100-point stake produces a 200-point payout to the winner (net +100); the other player loses their 100-point stake.

A waiting invitation can be cancelled for a refund, or expires after 15 minutes. Reopening the lobby/invitation processes an expired refund. Leaving an active match forfeits it. Failing to roll within 45 seconds forfeits the turn owner's match. An unresolved room older than one hour is refunded on its next server check. Polls do not reset deadlines. The online match keeps running while a client opens its local pause screen or backgrounds the app.

Payouts, purchases and refunds are transaction-locked and idempotent. Clients cannot directly edit the points wallet, room state or audit log, and cannot execute internal scoring/settlement functions. The UI polls shared state and predicts animation only; prediction cannot award points. Network latency can still affect reaction timing. This is not a claim of complete anti-bot protection.

## Validation

Tests exercise the real migration functions in embedded PostgreSQL using Supabase Auth/role/storage fixtures: cross-account isolation, avatar path ownership, private wallet mutation rejection, duplicate requests, invitation acceptance, server scoring, winner-takes-all payout and refunds. DOM tests check stake consent and invitation creation. Two simultaneously signed-in physical phones have not been manually played together in this environment.
