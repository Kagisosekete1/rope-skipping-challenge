import { dom } from "./dom-environment.js";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import test from "node:test";
import assert from "node:assert/strict";
import Profile from "../src/Profile.jsx";
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const user = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "player@example.test",
};
function button(text) {
  const b = [...document.querySelectorAll("button")].find(
    (b) => b.textContent.trim() === text,
  );
  assert.ok(b, `button ${text}`);
  return b;
}
async function click(node) {
  await act(async () => {
    node.click();
  });
}
async function fill(id, value) {
  await act(async () => {
    const input = document.getElementById(id);
    Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    ).set.call(input, value);
    input.dispatchEvent(new window.Event("input", { bubbles: true }));
  });
}
test("email signup, verification notice, sign-in, own profile save and sign-out use the correct account", async () => {
  const requests = [],
    saved = [],
    messages = [];
  let signedUp = null,
    signedIn = null,
    signOuts = 0;
  const client = {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe() {} } },
      }),
      signUp: async (args) => {
        signedUp = args;
        return { error: null, data: { session: null } };
      },
      signInWithPassword: async (args) => {
        signedIn = args;
        return { error: null, data: { session: { user } } };
      },
      signOut: async () => {
        signOuts++;
        return { error: null };
      },
    },
    from(table) {
      assert.equal(table, "profiles");
      return {
        select(columns) {
          assert.equal(
            columns,
            "display_name,avatar,username,country_code,photo_path,leaderboard_visible",
          );
          return {
            eq(field, id) {
              assert.equal(field, "id");
              assert.equal(id, user.id);
              return {
                maybeSingle: async () => ({
                  data: {
                    display_name: "Rope Star",
                    avatar: "pink",
                    username: "rope_star",
                    country_code: "ZA",
                    photo_path: null,
                    leaderboard_visible: true,
                  },
                  error: null,
                }),
              };
            },
          };
        },
        upsert: async (payload, options) => {
          requests.push({ payload, options });
          return { error: null };
        },
      };
    },
  };
  const errors = [],
    root = createRoot(document.getElementById("root"), {
      onUncaughtError: (e) => errors.push(e),
    });
  try {
    await act(async () => {
      root.render(
        <Profile
          client={client}
          profile={{ displayName: "My Crew", avatar: "blue" }}
          onSave={(p) => saved.push(p)}
          onNotify={(m) => messages.push(m)}
        />,
      );
    });
    await click(button("CHOOSE GALLERY PHOTO"));
    assert.match(document.querySelector(".photo-message").textContent,/Sign in below/);
    assert.equal(signedUp,null,"photo chooser never submits account forms");
    await click(button("New to the playground? Create an account"));
    await fill("profile-email", user.email);
    await fill("profile-password", "sample-password-123");
    await click(button("CREATE ACCOUNT"));
    assert.equal(signedUp.email, user.email);
    assert.equal(signedUp.options.data.display_name, "My Crew");
    assert.ok(signedUp.options.emailRedirectTo.endsWith("/?profile=1"));
    assert.match(
      document.querySelector('.profile-status').textContent,
      /Check your email/,
    );
    await click(button("Already have an account? Sign in"));
    await fill("profile-password", "sample-password-123");
    await click(button("SIGN IN"));
    assert.equal(signedIn.email, user.email);
    assert.match(
      document.querySelector(".account-section").textContent,
      /Signed in/,
    );
    assert.equal(document.getElementById("player-name").value, "Rope Star");
    let pickerOpened=0;
    document.getElementById("gallery-photo").click=()=>pickerOpened++;
    await click(button("CHOOSE GALLERY PHOTO"));
    assert.equal(pickerOpened,1,"signed-in tap directly opens the native file picker");
    assert.equal(requests.length,0,"photo chooser does not submit profile form");
    await fill("player-name", "New Player");
    await click(document.querySelector('[aria-label="yellow profile avatar"]'));
    await click(button("SAVE PROFILE"));
    assert.deepEqual(requests[0].payload, {
      id: user.id,
      display_name: "New Player",
      avatar: "yellow",
      username: "rope_star",
      country_code: "ZA",
      photo_path: null,
      leaderboard_visible: true,
    });
    assert.equal(requests[0].options.onConflict, "id");
    assert.match(messages.at(-1), /saved to your account/);
    await click(button("Sign out"));
    assert.equal(signOuts, 1);
    assert.equal(saved.at(-1).displayName, "Player 1");
    assert.ok(document.getElementById("profile-email"));
    assert.deepEqual(errors, []);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});
