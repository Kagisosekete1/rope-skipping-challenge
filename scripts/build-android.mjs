import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, copyFile, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
const win = process.platform === "win32";
function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: win, ...opts });
  if (r.status !== 0) process.exit(r.status || 1);
}
run(win ? "npx.cmd" : "npx", ["cap", "sync", "android"]);
if (!existsSync("android/debug.keystore"))
  run(
    process.env.JAVA_HOME
      ? join(process.env.JAVA_HOME, "bin", win ? "keytool.exe" : "keytool")
      : "keytool",
    [
      "-genkeypair",
      "-keystore",
      "android/debug.keystore",
      "-storepass",
      "android",
      "-keypass",
      "android",
      "-alias",
      "androiddebugkey",
      "-dname",
      "CN=Rope Skipping Challenge Test,O=Sekete Films",
      "-keyalg",
      "RSA",
      "-keysize",
      "2048",
      "-validity",
      "10000",
    ],
  );
run(
  win ? "gradlew.bat" : "./gradlew",
  ["assembleDebug", "--no-daemon", "--console=plain"],
  { cwd: "android" },
);
await mkdir("public/downloads", { recursive: true });
const path = "public/downloads/Rope-Skipping-Challenge-test.apk";
await copyFile("android/app/build/outputs/apk/debug/app-debug.apk", path);
const bytes = await readFile(path);
await writeFile(
  path + ".sha256",
  createHash("sha256").update(bytes).digest("hex") +
    "  Rope-Skipping-Challenge-test.apk\n",
);
console.log("Android test APK ready:", path, "(" + bytes.length + " bytes)");
