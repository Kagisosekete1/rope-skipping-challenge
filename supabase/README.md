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
