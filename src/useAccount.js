import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import { localProfile } from "./profile-data.js";
export function useAccount() {
  const [user, setUser] = useState(null),
    [wallet, setWallet] = useState(null),
    [error, setError] = useState(""),
    [profile, setProfile] = useState(null);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setUser(data.session?.user || null);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user || null);
      setWallet(null);
      setProfile(null);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  const reload = useCallback(async () => {
    if (!supabase || !user) return;
    const { data, error } = await supabase.rpc("get_my_points");
    if (error) {
      setError("Online features are being updated. Try again shortly.");
      return;
    }
    setWallet(data);
    setError("");
    const result = await supabase
      .from("profiles")
      .select(
        "display_name,avatar,username,country_code,photo_path,leaderboard_visible",
      )
      .eq("id", user.id)
      .maybeSingle();
    if (result.data) {
      const p = result.data;
      setProfile(
        localProfile({
          displayName: p.display_name,
          avatar: p.avatar,
          username: p.username,
          countryCode: p.country_code,
          photoPath: p.photo_path,
          leaderboardVisible: p.leaderboard_visible,
        }),
      );
    }
    return data;
  }, [user?.id]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { user, profile, wallet, setWallet, error, reload, client: supabase };
}
