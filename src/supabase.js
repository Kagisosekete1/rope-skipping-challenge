import { createClient } from "@supabase/supabase-js";
import { isPublicSupabaseKey } from "./profile-data.js";
import publicConfig from "./backend-config.json";
const url = import.meta.env.VITE_SUPABASE_URL || publicConfig.url;
const key =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || publicConfig.publishableKey;
export const supabase =
  url &&
  /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url) &&
  isPublicSupabaseKey(key)
    ? createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;
