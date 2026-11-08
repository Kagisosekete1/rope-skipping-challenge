import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeName,
  validProfile,
  localProfile,
  isPublicSupabaseKey,
} from "../src/profile-data.js";
test("profile names normalize spacing and enforce the published limits", () => {
  assert.equal(normalizeName("  MoFunk   Crew "), "MoFunk Crew");
  assert.ok(validProfile({ displayName: "MoFunk", avatar: "pink" }));
  assert.equal(validProfile({ displayName: "x", avatar: "pink" }), false);
  assert.equal(
    validProfile({ displayName: "x".repeat(25), avatar: "pink" }),
    false,
  );
  assert.equal(validProfile({ displayName: "MoFunk", avatar: "robot" }), false);
  assert.equal(validProfile(null), false);
  assert.equal(localProfile().avatar, "pink");
});
test("only publishable or anon client keys are accepted", () => {
  assert.ok(isPublicSupabaseKey("sb_publishable_example123"));
  const token = (role) =>
    "header." + btoa(JSON.stringify({ role })) + ".signature";
  assert.ok(isPublicSupabaseKey(token("anon")));
  assert.equal(isPublicSupabaseKey(token("service_role")), false);
  assert.equal(isPublicSupabaseKey("sb_secret_example"), false);
  assert.equal(isPublicSupabaseKey("a random database password"), false);
});
