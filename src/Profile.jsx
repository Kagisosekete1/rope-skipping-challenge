import React, { useEffect, useState } from "react";
import { supabase as configuredClient } from "./supabase";
import {
  AVATARS,
  localProfile,
  normalizeName,
  validProfile,
} from "./profile-data.js";
export default function Profile({
  profile,
  onSave,
  onNotify,
  client = configuredClient,
}) {
  const [draft, setDraft] = useState(() => localProfile(profile)),
    [session, setSession] = useState(null),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [signup, setSignup] = useState(false),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState(""),
    [authReady, setAuthReady] = useState(!client);
  useEffect(() => {
    setDraft(localProfile(profile));
  }, [profile]);
  useEffect(() => {
    if (!client) return;
    let active = true;
    client.auth
      .getSession()
      .then(({ data, error }) => {
        if (active) {
          setSession(data?.session ?? null);
          setAuthReady(true);
          if (error) setStatus("Please sign in again.");
        }
      })
      .catch(() => {
        if (active) {
          setAuthReady(true);
          setStatus("Could not reach the account service.");
        }
      });
    const { data } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setAuthReady(true);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (!client || !session?.user) return;
    let active = true;
    client
      .from("profiles")
      .select("display_name,avatar")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setStatus(
            "Online profile setup is not ready yet. Your local profile is available.",
          );
          return;
        }
        if (data) {
          const value = { displayName: data.display_name, avatar: data.avatar };
          setDraft(value);
          onSave(value);
        }
      })
      .catch(() => {
        if (active) setStatus("Could not load your online profile.");
      });
    return () => {
      active = false;
    };
  }, [session?.user?.id]);
  async function authenticate(e) {
    e.preventDefault();
    if (!client || busy) return;
    setBusy(true);
    setStatus("");
    try {
      const result = signup
        ? await client.auth.signUp({
            email: email.trim(),
            password,
            options: {
              emailRedirectTo:
                window.location.origin +
                window.location.pathname +
                "?profile=1",
              data: {
                display_name: normalizeName(draft.displayName),
                avatar: draft.avatar,
              },
            },
          })
        : await client.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
      if (result.error) {
        setStatus(result.error.message);
        return;
      }
      setPassword("");
      if (signup && !result.data.session)
        setStatus("Check your email to confirm your account, then sign in.");
      else setSession(result.data.session);
    } catch {
      setStatus("Could not connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function save(e) {
    e.preventDefault();
    const value = { ...draft, displayName: normalizeName(draft.displayName) };
    if (!validProfile(value)) {
      setStatus("Choose a name with 2–24 characters and a crew avatar.");
      return;
    }
    if (busy) return;
    setBusy(true);
    setStatus("");
    try {
      if (client && session?.user) {
        const { error } = await client
          .from("profiles")
          .upsert(
            {
              id: session.user.id,
              display_name: value.displayName,
              avatar: value.avatar,
            },
            { onConflict: "id" },
          );
        if (error) {
          setStatus(
            "Your online profile could not be saved. Please try again.",
          );
          return;
        }
      }
      onSave(value);
      onNotify(
        session
          ? "Profile saved to your account!"
          : "Profile saved on this device!",
      );
    } catch {
      setStatus("Could not save your profile. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    if (!client) return;
    setBusy(true);
    const { error } = await client.auth.signOut();
    setBusy(false);
    if (error) {
      setStatus("Could not sign out. Please try again.");
      return;
    }
    setSession(null);
    setEmail("");
    setPassword("");
    const guest = localProfile();
    setDraft(guest);
    onSave(guest);
    onNotify("Signed out. You can keep playing as a guest.");
  }
  return (
    <section className="profile-panel glass">
      <div className="profile-intro">
        <span className="profile-badge">YOUR PLAYGROUND ID</span>
        <h2>Make your name.</h2>
        <p>Pick a name and a face for your next big jump.</p>
      </div>
      <form onSubmit={save} className="profile-form">
        <label htmlFor="player-name">Player name</label>
        <input
          id="player-name"
          name="displayName"
          autoComplete="nickname"
          minLength={2}
          maxLength={24}
          required
          value={draft.displayName}
          onChange={(e) =>
            setDraft((d) => ({ ...d, displayName: e.target.value }))
          }
        />
        <span className="field-label">Choose your crew avatar</span>
        <div className="profile-avatars">
          {AVATARS.map((avatar, i) => (
            <button
              type="button"
              key={avatar}
              className={draft.avatar === avatar ? "selected" : ""}
              aria-label={`${avatar} profile avatar`}
              aria-pressed={draft.avatar === avatar}
              style={{ "--avatar": ["#fc278b", "#087ff6", "#ffcb13"][i] }}
              onClick={() => setDraft((d) => ({ ...d, avatar }))}
            >
              <span>{["P", "B", "Y"][i]}</span>
              {["Ponytail", "Blue crew", "Sunshine"][i]}
            </button>
          ))}
        </div>
        <button className="button gold" disabled={busy || !authReady}>
          {busy ? "SAVING…" : "SAVE PROFILE"}
        </button>
      </form>
      <div className="account-section">
        {!client ? (
          <>
            <b>Play now. Connect later.</b>
            <p>
              Your name and avatar save on this device. Online accounts will be
              available when the account connection is ready.
            </p>
          </>
        ) : !authReady ? (
          <p>Checking your account…</p>
        ) : session ? (
          <>
            <b>Signed in</b>
            <p className="account-email">{session.user.email}</p>
            <p>
              Your name and avatar sync to this account. Coins and match
              progress currently stay on this device.
            </p>
            <button className="text-button" onClick={signOut} disabled={busy}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <h3>{signup ? "Create your account" : "Welcome back"}</h3>
            <form className="account-form" onSubmit={authenticate}>
              <label htmlFor="profile-email">Email</label>
              <input
                id="profile-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label htmlFor="profile-password">Password</label>
              <input
                id="profile-password"
                type="password"
                minLength={8}
                autoComplete={signup ? "new-password" : "current-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button className="button blue" disabled={busy}>
                {busy ? "PLEASE WAIT…" : signup ? "CREATE ACCOUNT" : "SIGN IN"}
              </button>
            </form>
            <button
              className="text-button"
              disabled={busy}
              onClick={() => {
                setSignup((s) => !s);
                setStatus("");
              }}
            >
              {signup
                ? "Already have an account? Sign in"
                : "New to the playground? Create an account"}
            </button>
          </>
        )}
        {status && (
          <p className="profile-status" role="status">
            {status}
          </p>
        )}
      </div>
    </section>
  );
}
