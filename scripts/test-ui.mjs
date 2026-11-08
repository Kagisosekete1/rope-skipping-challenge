import { build } from "esbuild";
import { mkdir, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
await mkdir(".test-tmp", { recursive: true });
const path = ".test-tmp/navigation.mjs";
await build({
  entryPoints: ["tests/navigation.jsx"],
  outfile: path,
  bundle: true,
  format: "esm",
  platform: "node",
  packages: "external",
  loader: { ".jsx": "jsx" },
  plugins: [
    {
      name: "mock-gpu-only",
      setup(b) {
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
