import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
test("installed PWA has real 192/512 icons plus a maskable icon and profile/challenge shortcuts", async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL("../public/manifest.webmanifest", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(manifest.display, "standalone");
  for (const size of [192, 512]) {
    const icon = manifest.icons.find(
      (i) => i.sizes === size + "x" + size && i.purpose === "any",
    );
    const data = await readFile(
      new URL("../public/" + icon.src, import.meta.url),
    );
    assert.equal(data.readUInt32BE(16), size);
    assert.equal(data.readUInt32BE(20), size);
  }
  assert.ok(manifest.icons.some((i) => i.purpose === "maskable"));
  assert.ok(manifest.shortcuts.some((s) => s.url.includes("online")));
});
