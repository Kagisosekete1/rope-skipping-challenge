import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";
import { localProfile } from "./profile-data.js";
export function useAccount() {
  const activeUser=useRef(null),walletBusy=useRef(false),reloadSequence=useRef(0);
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState(null),
    [wallet, rawSetWallet] = useState(null),
    [error, setError] = useState(""),
    [profile, setProfile] = useState(null);
  const setWallet=useCallback(data=>{if(!data)return;rawSetWallet(old=>old?.updated_at&&data.updated_at&&data.updated_at<old.updated_at?old:data);},[]);
  useEffect(() => {
    if (!supabase) {setAuthReady(true);return;}
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) {activeUser.current=data.session?.user?.id||null; setUser(data.session?.user || null); setAuthReady(true); }
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      const id=s?.user?.id||null;
      if(activeUser.current!==id){rawSetWallet(null);setProfile(null);}
      activeUser.current=id;setUser(s?.user || null);setAuthReady(true);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  const reload = useCallback(async () => {
    if (!supabase || !user) return;
    const sequence=++reloadSequence.current;
    const { data, error } = await supabase.rpc("get_my_points");
    if(activeUser.current!==user.id||sequence!==reloadSequence.current)return;
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
    if(activeUser.current!==user.id||sequence!==reloadSequence.current)return;
    if (result.data) {
      const p = result.data;
      const normalized=localProfile({
          displayName: p.display_name,
          gender: user.user_metadata?.gender,
          avatar: p.avatar,
          username: p.username,
          countryCode: p.country_code,
          photoPath: p.photo_path,
          leaderboardVisible: p.leaderboard_visible,
        });
      setProfile(normalized);
      if(normalized.avatar!==p.avatar)await supabase.from("profiles").update({avatar:normalized.avatar}).eq("id",user.id);
    }
    return data;
  }, [user?.id,user?.user_metadata?.gender]);
  useEffect(() => {
    reload();
  }, [reload]);
  useEffect(()=>{
    if(!supabase||!user)return;
    let active=true;
    const refresh=async()=>{if(document.hidden||walletBusy.current)return;walletBusy.current=true;try{const {data,error}=await supabase.rpc("get_my_points");if(active&&activeUser.current===user.id){if(error)setError("Points connection interrupted; retrying…");else{setWallet(data);setError("");}}}catch{if(active)setError("Points connection interrupted; retrying…");}finally{walletBusy.current=false;}};
    const timer=setInterval(refresh,2500);
    const channel=supabase.channel?.('points-'+user.id).on('postgres_changes',{event:'*',schema:'public',table:'challenge_wallets',filter:'user_id=eq.'+user.id},refresh).subscribe();
    window.addEventListener('focus',refresh);window.addEventListener('online',refresh);document.addEventListener('visibilitychange',refresh);
    return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',refresh);window.removeEventListener('online',refresh);document.removeEventListener('visibilitychange',refresh);if(channel)supabase.removeChannel(channel);};
  },[user?.id]);
  return { authReady, user, profile, wallet, setWallet, error, reload, client: supabase };
}
