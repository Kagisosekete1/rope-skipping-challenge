export const AVATARS = ["pink", "blue", "yellow"];
export function normalizeName(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}
export function validProfile(profile) {
  const name = normalizeName(profile?.displayName);
  return (
    [...name].length >= 2 &&
    [...name].length <= 24 &&
    AVATARS.includes(profile?.avatar)
  );
}
export function localProfile(value) {
  return {
    displayName: normalizeName(value?.displayName) || "Player 1",
    avatar: AVATARS.includes(value?.avatar) ? value.avatar : "pink",
  };
}

export function isPublicSupabaseKey(value) {
  if (typeof value !== "string") return false;
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(value)) return true;
  try {
    const payload = value.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload)).role === "anon";
  } catch {
    return false;
  }
}
