# Supabase setup

Project: `ipfqkrbppfwqssriglpi`.

The browser uses only the publishable key. It is intentionally public and subject to database Row Level Security. No secret key, service-role key, signing secret or database password is used in the game or committed to this repository. `src/backend-config.json` contains the project URL and client-safe publishable key; optional `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` values override them at build time.

## Do these steps in your Supabase dashboard

1. Open **SQL Editor → New query**. Paste all of [`001_rope_skipping.sql`](./001_rope_skipping.sql) and click **Run**. This is designed for a new project; if you already have app tables with the same names, review their column compatibility first. It does not drop tables or player records.
2. Open **Authentication → Providers → Email**. Enable email signup and keep email confirmation enabled. The game requires an eight-character password; choose the same or stronger setting in Supabase. Set up SMTP before a wider release if your project's default email service is limited.
3. Open **Authentication → URL Configuration**. Set **Site URL** to:
   `https://rope-skipping-challenge-kagiso.seketefilmstv.chatgpt.site`
4. Add this exact **Redirect URL**:
   `https://rope-skipping-challenge-kagiso.seketefilmstv.chatgpt.site/?profile=1`
   Add your localhost development URL with `?profile=1` only if testing locally.
5. Open the game's Home screen, select **My Profile**, choose **Create an account**, confirm the email, sign in and save the profile.

The Site's existing sharing settings are preserved. A private Site still asks you to access it with ChatGPT before game-account sign-in. This change does not make the Site public.

## Tables

| Table | Purpose | Browser write access |
|---|---|---|
| `profiles` | Player name and crew avatar | Own name/avatar only |
| `player_settings` | Sound, music, 40% default volume, graphics, rope, favorite song | Own valid settings |
| `player_wallets` | Coins and XP | None; protected functions only |
| `player_stats` | Wins, matches, best streak and rank points | None; trusted match processing only |
| `shop_catalog` | All outfit, hair, shoes and rope prices/colors | None |
| `owned_cosmetics` | Purchased/unlocked items | None; purchase function only |
| `player_looks` | The three crew members' equipped cosmetics | Own owned/default items only |
| `music_tracks` | The five Rope Rush tracks | None |
| `game_matches` | Match mode, state, verified result and reward status | Create via `start_game_match` only |
| `match_participants` | Player/BeatBot/guest participation and scores | None; trusted match processing only |
| `reward_ledger` | Starter coins, purchases and one-time match rewards | None |

Supabase Auth supplies `auth.users`, email verification, password hashing and sessions. Do not create an application password table.

## Functions

- Signup trigger creates a profile, settings, wallet, stats, default inventory and crew looks. Existing Auth users are backfilled when the script is run. Reruns do not add starter coins again.
- `purchase_cosmetic(item_id)` reads the server price and locks the wallet before spending. Repeated requests for an owned item do not charge again.
- `start_game_match(mode, difficulty, request_id)` creates a match with a reusable idempotency UUID. The computer participant is BeatBot.
- `award_verified_match(match_id)` is executable only by the trusted `service_role`. It requires a server-verified completed result and awards coins/XP once. Do not expose a service key in browser code or trust a browser's claim of a win.

## What is wired in this release

Email signup/sign-in/sign-out and the profile's name/avatar use Supabase. Guest profiles still work on the device. Coins, gameplay statistics, purchases and crew customization currently continue using the game's existing local save. The tables/RPCs for those features are ready for a later server-integration pass; they are not silently treated as authoritative cloud progress. A trusted match-validation backend is still needed before cloud currency rewards can be enabled safely.

This schema is validated locally against an embedded PostgreSQL engine with a Supabase Auth/role test harness. The owner has applied the SQL, and the live catalog API responds successfully. A real email-confirmation/sign-in round trip must still be verified with the owner’s account.

## 2.2 upgrade

For profiles with gallery photos/countries, public rankings, paid Freeze and online point challenges, run `upgrade-2.2.sql` after 001. It bundles migrations 002, 003 and 004. The owner has applied this upgrade. See the repository's `ONLINE.md` for the server authority, escrow/refund rules and current validation limits. Do not rerun 001 after applying the upgrade, because later migrations extend its signup behavior.

## Progress and account deletion upgrade
After upgrade-2.2.sql, run **005_progress_and_deletion.sql** in SQL Editor.
It adds private practice saves (levels, cosmetics and device settings), isolated
from trusted online point balances. The authenticated delete_my_account RPC
refuses deletion until waiting/active challenges are finished or cancelled.
Completed rooms involving the deleted account are removed; other users' wallets
and settled balances are unchanged. The client removes owned gallery photos via
Storage API before invoking deletion. No service key is shipped to browsers.
Sign in and check Settings for a successful cloud save before reinstalling.
Simultaneous devices use the latest completed save, not a merge of two matches.

## Live updates (006)
Run `006_live_updates.sql` after 005. It enables Supabase Realtime publication
for challenge rooms and point wallets under their existing participant/owner
RLS, and timestamps wallet changes so older responses cannot replace newer
balances. No private wallet is made public. The public leaderboard still uses
the sanitized ranking RPC, refreshed every 2.5 seconds; online matches use push
updates plus a non-overlapping 500 ms server-tick fallback. Gender selection is
stored privately in Supabase Auth user metadata and does not need a table field.

## Historical six rule (007; superseded by 008)
Apply `007_six_roll_again.sql` after 006. It updates only server game functions:
a six returns the current player to an idle reroll with a fresh turn deadline,
without changing progress, the stake, the point pot or the player whose turn it
is. The next roll clears the reroll flag. Existing RLS and action idempotency are
preserved. Local solo/pass-and-play use the same rule in the game engine.

## Six jumps, bonus turn and public cast (008)
Apply `008_six_jumps_and_cast.sql` after 007. A six now enters normal skipping:
complete all six jumps to earn another roll on the same turn. It also includes
sanitized public avatar IDs in challenge snapshots so each client displays the
correct opponent. Private gender metadata is never returned. Stake escrow,
wallet protections, settlement and action idempotency remain unchanged.
