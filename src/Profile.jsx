import { COUNTRIES } from "./countries";
import { CartoonPreview } from "./CartoonScene";
import { preparePhoto } from "./photos";
import React, { useEffect, useState, useRef } from "react";
import { supabase as configuredClient } from "./supabase";
import {
  AVATARS,
  GENDERS,
  withGender,
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
  const photoInput = useRef(null);
  const [photoStatus, setPhotoStatus] = useState("");
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
      .select(
        "display_name,avatar,username,country_code,photo_path,leaderboard_visible",
      )
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
          const value = localProfile({
            displayName: data.display_name,
            gender: session.user.user_metadata?.gender || draft.gender,
            avatar: data.avatar,
            username: data.username,
            countryCode: data.country_code,
            photoPath: data.photo_path,
            leaderboardVisible: data.leaderboard_visible,
          });
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
    if(signup && !draft.gender){setStatus("Please choose your gender, or Prefer not to say.");return;}
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
                gender: draft.gender,
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
    const value = localProfile({ ...draft, displayName: normalizeName(draft.displayName) });
    if (!validProfile(value)) {
      setStatus("Choose a name with 2–24 characters and a crew avatar.");
      return;
    }
    if (session && !/^[a-zA-Z0-9_]{3,24}$/.test(value.username)) {
      setStatus("Choose a username with 3–24 letters, numbers or underscores.");
      return;
    }
    if (busy) return;
    setBusy(true);
    setStatus("");
    try {
      if (client && session?.user) {
        if(value.gender && value.gender!==session.user.user_metadata?.gender){const {error}=await client.auth.updateUser({data:{gender:value.gender}});if(error)throw error;}
        const { error } = await client.from("profiles").upsert(
          {
            id: session.user.id,
            display_name: value.displayName,
            avatar: value.avatar,
            username: value.username,
            country_code: value.countryCode,
            photo_path: value.photoPath,
            leaderboard_visible: value.leaderboardVisible,
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
      if (
        session &&
        profile.photoPath &&
        profile.photoPath !== value.photoPath &&
        profile.photoPath.startsWith(session.user.id + "/")
      )
        await client.storage.from("player-avatars").remove([profile.photoPath]);
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
  async function upload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || busy) return;
    if (!session) {
      setStatus("Sign in to upload a public profile photo.");
      return;
    }
    setBusy(true);
    setPhotoStatus("Preparing your photo…");
    try {
      const blob = await preparePhoto(file),
        extension =
          blob.type === "image/png"
            ? "png"
            : blob.type === "image/jpeg"
              ? "jpg"
              : "webp";
      const path =
        session.user.id + "/" + crypto.randomUUID() + "." + extension;
      setPhotoStatus("Uploading your photo…");
      const { error } = await client.storage
        .from("player-avatars")
        .upload(path, blob, { contentType: blob.type, upsert: false });
      if (error) throw error;
      setDraft((d) => ({ ...d, photoPath: path }));
      setPhotoStatus(
        "Photo uploaded. Save your profile to publish it on the leaderboard.",
      );
    } catch (e) {
      setPhotoStatus(e.message || "Photo upload failed. Check your connection and try again.");
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
        <label htmlFor="username">Public username</label>
        <input
          id="username"
          name="username"
          minLength={3}
          maxLength={24}
          pattern="[a-zA-Z0-9_]{3,24}"
          required={!!session}
          value={draft.username}
          onChange={(e) =>
            setDraft((d) => ({ ...d, username: e.target.value }))
          }
          placeholder="your_name"
          autoComplete="username"
        />
        <label htmlFor="player-gender">Gender</label>
        <select id="player-gender" value={draft.gender} onChange={e=>setDraft(d=>withGender(d,e.target.value))}>
          <option value="">Choose gender</option>{Object.entries(GENDERS).map(([value,label])=><option key={value} value={value}>{label}</option>)}
        </select>
        <p className="photo-help">Male selects Ziggy; female selects Poppy or Sunny. You can change your gender and compatible avatar here. Gender stays private.</p>
        <label htmlFor="country">Country</label>
        <select
          id="country"
          value={draft.countryCode}
          onChange={(e) =>
            setDraft((d) => ({ ...d, countryCode: e.target.value }))
          }
        >
          <option value="">Choose your country</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="profile-photo-controls">
          {draft.photoPath && client ? (
            <img
              className="profile-gallery-photo"
              src={
                client.storage
                  .from("player-avatars")
                  .getPublicUrl(draft.photoPath).data.publicUrl
              }
              alt="Your chosen public profile photo"
            />
          ) : (
            <span className="profile-photo-placeholder">
              {draft.displayName.slice(0, 1)}
            </span>
          )}
          <div>
            <button type="button" className="button blue photo-picker" disabled={busy || !authReady}
              onClick={() => {
                if (!session) {
                  setPhotoStatus("Sign in below to add your gallery photo to your account.");
                  document.getElementById("profile-email")?.scrollIntoView?.({behavior:"smooth",block:"center"});
                  document.getElementById("profile-email")?.focus();
                  return;
                }
                photoInput.current?.click();
              }}>
              {busy ? "PLEASE WAIT…" : "CHOOSE GALLERY PHOTO"}
            </button>
            <input ref={photoInput} id="gallery-photo" type="file" accept="image/*,.heic,.heif" hidden disabled={busy || !session} onChange={upload} />
            <p className="photo-help">{session ? "Choose a photo, then tap Save Profile." : "Sign in to upload a gallery photo. Crew avatars work for guests."}</p>
            {photoStatus && <p className="photo-message" role="status">{photoStatus}</p>}
            {draft.photoPath && (
              <button
                className="text-button"
                type="button"
                onClick={() => setDraft((d) => ({ ...d, photoPath: null }))}
              >
                Remove photo
              </button>
            )}
          </div>
        </div>
        <label className="public-profile-choice">
          <input
            type="checkbox"
            checked={draft.leaderboardVisible}
            onChange={(e) =>
              setDraft((d) => ({ ...d, leaderboardVisible: e.target.checked }))
            }
          />{" "}
          Show my username, photo, country and points on the public leaderboard
        </label>
        <p className="community-note">
          Uploaded photos are public. Email addresses are never shown.
        </p>
        <span className="field-label">Choose your crew avatar</span>
        <div className="profile-avatars">
          {AVATARS.map((avatar, i) => (
            <button
              type="button"
              key={avatar}
              className={draft.avatar === avatar ? "selected" : ""}
              disabled={busy || (draft.gender==="male" && avatar!=="blue") || (draft.gender==="female" && avatar==="blue")}
              aria-label={`${avatar} profile avatar`}
              aria-pressed={draft.avatar === avatar}
              style={{ "--avatar": ["#fc278b", "#087ff6", "#ffcb13"][i] }}
              onClick={() => setDraft((d) => ({ ...d, avatar }))}
            >
              <CartoonPreview kind={i} portrait className="crew-portrait"/>
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
              Your profile syncs to this account. Check Settings for your cloud progress save status.
            </p>
            <button className="text-button" onClick={signOut} disabled={busy}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <h3>{signup ? "Create your account" : "Welcome back"}</h3>
            <form className="account-form" onSubmit={authenticate}>
              {signup && <><label htmlFor="signup-gender">Gender</label><select id="signup-gender" required value={draft.gender} onChange={e=>setDraft(d=>withGender(d,e.target.value))}><option value="">Choose gender</option>{Object.entries(GENDERS).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></>}
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
