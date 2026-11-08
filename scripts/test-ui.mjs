import { build } from "esbuild";
import { mkdir, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
await mkdir(".test-tmp", { recursive: true });
const account = process.argv[2] === "account",
  online = process.argv[2] === "online";
const path = online
  ? ".test-tmp/online-ui.mjs"
  : account
    ? ".test-tmp/account-ui.mjs"
    : ".test-tmp/navigation.mjs";
await build({
  entryPoints: [
    online
      ? "tests/online-ui.jsx"
      : account
        ? "tests/account-ui.jsx"
        : "tests/navigation.jsx",
  ],
  outfile: path,
  bundle: true,
  format: "esm",
  platform: "node",
  packages: "external",
  define: { "import.meta.env": "{}" },
  loader: { ".jsx": "jsx" },
  plugins: [
    {
      name: "mock-gpu-only",
      setup(b) {
        b.onResolve({ filter: /dom-environment\.js$/ }, () => ({
          path: resolve("tests/dom-environment.js"),
          external: true,
        }));
        b.onResolve({ filter: /^\.\/supabase$/ }, () => ({
          path: resolve("tests/mocks/supabase.js"),
        }));
        b.onResolve({ filter: /^\.\/Scene$/ }, () => ({
          path: resolve("tests/mocks/Scene.jsx"),
        }));
        b.onResolve({ filter: /^@react-three\/fiber$/ }, () => ({
          path: resolve("tests/mocks/fiber.jsx"),
        }));
        b.onResolve({ filter: /^@react-three\/drei$/ }, () => ({
          path: resolve("tests/mocks/drei.jsx"),
        }));
      },
    },
  ],
});
const result = spawnSync(process.execPath, ["--test", path], {
  stdio: "inherit",
});
await unlink(path);
process.exitCode = result.status ?? 1;
