import { build } from "esbuild";
import { mkdir, unlink } from "node:fs/promises";
import { spawnSync } from "node:child_process";
await mkdir(".test-tmp", { recursive: true });
const path = ".test-tmp/character-scene.mjs";
await build({
  entryPoints: ["tests/character-scene.jsx"],
  outfile: path,
  bundle: true,
  format: "esm",
  platform: "node",
  packages: "external",
  loader: { ".jsx": "jsx" },
});
const result = spawnSync(process.execPath, ["--test", path], {
  stdio: "inherit",
});
await unlink(path);
process.exitCode = result.status ?? 1;
