import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";
import { COUNTRIES, flag } from "./countries";
export function photoUrl(path) {
  return path && supabase
    ? supabase.storage.from("player-avatars").getPublicUrl(path).data.publicUrl
    : null;
}
export function Leaderboard() {
  const busy=useRef(false);
  const [rows, setRows] = useState([]),
    [status, setStatus] = useState("Loading the playground rankings…");
  async function load() {
    if(busy.current || document.hidden)return;
    if (!supabase) {
      setStatus("Rankings are temporarily unavailable.");
      return;
    }
    busy.current=true;
    const { data, error } = await supabase.rpc("get_leaderboard", {
      p_limit: 100,
    });
    busy.current=false;
    if (error) {
      setStatus("Rankings are being updated. Try again shortly.");
      return;
    }
    setRows(data || []);
    setStatus(data?.length ? "" : "Be the first name on the board!");
  }
  useEffect(() => {
    load();const timer=setInterval(load,2500);window.addEventListener("focus",load);document.addEventListener("visibilitychange",load);
    return()=>{clearInterval(timer);window.removeEventListener("focus",load);document.removeEventListener("visibilitychange",load);};
  }, []);
  return (
    <section className="community-panel glass">
      <div className="community-heading">
        <h2>Playground champions</h2>
        <button className="text-button" onClick={load}>
          Refresh
        </button>
      </div>
      <p className="community-note">
        Online points · Auto-refresh every 2.5 seconds · Coins are for the shop
      </p>
      {status && <p role="status">{status}</p>}
      <div className="leaderboard-rows">
        {rows.map((p, i) => (
          <div className="leaderboard-row" key={p.username}>
            <b className="rank-number">{i + 1}</b>
            {p.photo_path ? (
              <img
                loading="lazy"
                decoding="async"
                className="leader-photo"
                src={photoUrl(p.photo_path)}
                alt=""
              />
            ) : (
              <span className={"leader-photo avatar-" + p.avatar}>
                {p.display_name?.slice(0, 1)}
              </span>
            )}
            <div>
              <strong>@{p.username}</strong>
              <small>
                {flag(p.country_code)}{" "}
                {COUNTRIES.find((c) => c.code === p.country_code)?.name ||
                  "Country not set"}{" "}
                · {p.wins} wins
              </small>
            </div>
            <b className="rank-points">
              {Number(p.points).toLocaleString()}
              <small>POINTS</small>
            </b>
          </div>
        ))}
      </div>
    </section>
  );
}
export function OnlineLobby({ account, onStart, onProfile, onNotify }) {
  const queryCode =
    new URLSearchParams(window.location.search).get("challenge") ||
    sessionStorage.getItem("rsc_invite") ||
    "";
  const [stake, setStake] = useState("100"),
    [code, setCode] = useState(queryCode),
    [room, setRoom] = useState(null),
    [preview, setPreview] = useState(null),
    [pending, setPending] = useState([]),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState("");
  const client = account.client;
  useEffect(() => {
    if (queryCode) sessionStorage.setItem("rsc_invite", queryCode);
  }, []);
  async function call(name, args) {
    if (!client) throw new Error("Online play is unavailable");
    const { data, error } = await client.rpc(name, args);
    if (error) throw error;
    return data;
  }
  async function resume() {
    if (!account.user) return;
    try {
      setPending((await call("my_challenges", {})) || []);
    } catch {
      setStatus("Online challenges are being updated. Try again shortly.");
    }
  }
  useEffect(() => {
    resume();
  }, [account.user?.id]);
  useEffect(() => {
    if (!room || room.status !== "waiting") return;
    const id = setInterval(async () => {
      try {
        const data = await call("challenge_action", {
          p_room: room.room_id,
          p_action: "poll",
          p_request_id: crypto.randomUUID(),
        });
        setRoom(data);
        account.setWallet(data.wallet);
        if (data.status === "active") {
          onStart(data);
        }
      } catch {
        setStatus("Reconnecting to your invitation…");
      }
    }, 1200);
    return () => clearInterval(id);
  }, [room?.room_id, room?.status]);
  async function act(fn) {
    if (busy) return;
    setBusy(true);
    setStatus("");
    try {
      await fn();
    } catch (e) {
      setStatus(e.message || "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function create() {
    const n = Number(stake);
    if (
      !Number.isSafeInteger(n) ||
      n < 1 ||
      n > Number(account.wallet?.points || 0)
    ) {
      setStatus("Choose a whole-number stake within your available points.");
      return;
    }
    await act(async () => {
      const r = await call("create_challenge", {
        p_stake: n,
        p_request_id: crypto.randomUUID(),
      });
      setRoom(r);
      account.setWallet(r.wallet);
    });
  }
  async function share() {
    const url = new URL(location.origin + location.pathname);
    url.searchParams.set("challenge", room.invite_code);
    const text = `Rope Skipping Challenge: ${room.stake} play points each. Winner takes ${room.stake * 2}!`;
    try {
      if (navigator.share)
        await navigator.share({ title: "Jump with me!", text, url: url.href });
      else {
        await navigator.clipboard.writeText(url.href);
        onNotify("Invitation link copied!");
      }
    } catch (e) {
      if (e.name !== "AbortError")
        setStatus("Copy the invitation code below and send it to your friend.");
    }
  }
  if (!account.user)
    return (
      <section className="community-panel glass lobby">
        <h2>Challenge a friend</h2>
        <p>
          Create an account or sign in to use online points and invitations.
        </p>
        <button className="button gold" onClick={onProfile}>
          SIGN IN / CREATE PROFILE
        </button>
        <p className="community-note">
          Play points only. No real-money purchase or cash-out.
        </p>
      </section>
    );
  return (
    <section className="community-panel glass lobby">
      <div className="points-balance">
        <span>AVAILABLE POINTS</span>
        <strong>{Number(account.wallet?.points || 0).toLocaleString()}</strong>
        <button
          className="text-button"
          onClick={() =>
            act(async () => {
              const r = await call("claim_daily_points");
              account.setWallet(r);
              onNotify(
                r.claimed
                  ? "+100 daily play points!"
                  : "Today’s points are already claimed.",
              );
            })
          }
        >
          Claim daily +100
        </button>
        <button
          className="text-button"
          disabled={busy}
          onClick={() =>
            act(async () => {
              const r = await call("buy_freeze", {
                p_request_id: crypto.randomUUID(),
              });
              account.setWallet(r);
              onNotify("Freeze token ready!");
            })
          }
        >
          Buy ❄ Freeze · 50 points ({account.wallet?.freeze_tokens || 0} ready)
        </button>
      </div>
      {account.error && <p>{account.error}</p>}
      {room?.status === "waiting" ? (
        <div className="invite-card">
          <h2>Your challenge is ready</h2>
          <p>
            {room.stake} points each · {room.stake * 2} point pot
          </p>
          <strong className="invite-code">{room.invite_code}</strong>
          <p>
            Your stake is held safely until a friend accepts. Waiting
            invitations expire after 15 minutes; reopen here to reclaim an
            expired stake.
          </p>
          <button className="button gold" onClick={share}>
            SHARE INVITE
          </button>
          <button
            className="text-button"
            disabled={busy}
            onClick={() =>
              act(async () => {
                const r = await call("challenge_action", {
                  p_room: room.room_id,
                  p_action: "cancel",
                  p_request_id: crypto.randomUUID(),
                });
                account.setWallet(r.wallet);
                setRoom(null);
                resume();
              })
            }
          >
            Cancel and refund my stake
          </button>
        </div>
      ) : (
        <>
          <div className="lobby-columns">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                create();
              }}
            >
              <h3>Invite a friend</h3>
              <label htmlFor="stake">Points each player stakes</label>
              <input
                id="stake"
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                max={account.wallet?.points || 0}
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                required
              />
              <button
                className="button gold"
                disabled={busy || !account.wallet}
              >
                CREATE INVITE
              </button>
            </form>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                act(async () =>
                  setPreview(await call("preview_challenge", { p_code: code })),
                );
              }}
            >
              <h3>Join a challenge</h3>
              <label htmlFor="invite-code">Invitation code</label>
              <input
                id="invite-code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setPreview(null);
                }}
                maxLength={12}
                autoCapitalize="characters"
                required
              />
              <button className="button blue" disabled={busy}>
                CHECK INVITATION
              </button>
            </form>
          </div>
          {preview && (
            <div className="invite-card">
              <h3>{preview.host} invites you</h3>
              <p>
                Stake {preview.stake} points. Winner receives the full{" "}
                {preview.pot} point pot.
              </p>
              <button
                className="button gold"
                disabled={busy}
                onClick={() =>
                  act(async () => {
                    const r = await call("accept_challenge", {
                      p_code: preview.invite_code,
                    });
                    account.setWallet(r.wallet);
                    onStart(r);
                  })
                }
              >
                ACCEPT — STAKE {preview.stake}
              </button>
            </div>
          )}
          {pending.length > 0 && (
            <div className="pending-rooms">
              <h3>Your open challenges</h3>
              {pending.map((r) => (
                <button
                  className="button blue"
                  key={r.room_id}
                  onClick={() =>
                    r.status === "active" ? onStart(r) : setRoom(r)
                  }
                >
                  {r.status === "active" ? "RESUME MATCH" : "OPEN INVITATION"} ·{" "}
                  {r.stake} points
                </button>
              ))}
            </div>
          )}
        </>
      )}
      <p className="challenge-rules">
        Both players stake the same amount; winner takes the whole pot. Stakes
        are deducted before play. Leaving an active match forfeits it. A player
        who does not roll for 45 seconds forfeits. A match left open for an hour
        is cancelled and refunded. Server time determines jumps and results.
      </p>
      {status && (
        <p className="profile-status" role="status">
          {status}
        </p>
      )}
      <button
        className="text-button"
        onClick={() => {
          account.reload();
          resume();
        }}
      >
        Refresh connection
      </button>
    </section>
  );
}
