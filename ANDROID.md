# Install and share the game

## Phone PWA

Open `https://rope-skipping-challenge-kagiso.seketefilmstv.chatgpt.site`.

- Android Chrome: Settings in the game → Install on your phone, or browser menu → Install app.
- iPhone Safari: Share → Add to Home Screen.
- Settings → Share game link opens the phone's sharing sheet, or copies the link when supported.

The manifest includes 192/512-pixel icons and a separate maskable icon made from the original Cartoon Edition artwork. Existing installations can take time to refresh their OS icon; the operating system may refresh its icon later. Avoid clearing site data to refresh an icon, because guest saves live in that storage.

The game shell and solo/two-player-on-one-device play work offline after a successful cache install. Streaming music, account synchronization, photos, leaderboards and online challenges need a connection. The APK is excluded from offline precaching.

## Android APK

Download `https://rope-skipping-challenge-kagiso.seketefilmstv.chatgpt.site/downloads/Rope-Skipping-Challenge-test.apk`.

This is a **debug-signed Android test build**, application ID `com.seketefilms.ropeskipping`, version 3.3.0, minimum Android 6 (API 23), target API 36. A compatible modern Android WebView with Canvas 2D is required. It uses Capacitor to open the live HTTPS game. It is a website-backed Android app, not a self-contained offline native port. The native launcher uses matching original Cartoon Edition artwork.

You can send the APK file or its download link through a sharing platform. Android may ask you to allow installation from your chosen browser/file app. A Play Store release needs your own persistent release-signing key and store setup; this test build is not a store submission.

## Rebuild

Requirements: Node 22.12+, JDK 21 with `javac`, Android SDK platform 36 and Build Tools 34/35, accepted Android SDK licenses, and `ANDROID_HOME` set to your SDK directory. Gradle downloads dependencies from its official repositories. `JAVA_HOME` should point to the JDK.

```sh
npm ci
npm run android:build
npm run build
```

The build helper syncs Capacitor, creates a local debug keystore if absent, builds the APK, and copies it plus a SHA-256 checksum into `public/downloads/`. The keystore, local SDK paths, Gradle caches and build directories are ignored by Git. Keep production release keys outside the repository.

The supplied test APK has been compiled and its package/signature checked. It has not been installed and played on a physical Android phone in this session.

## Android App Bundle for the publisher

`npm run android:build` also generates `public/downloads/Rope-Skipping-Challenge-release-unsigned.aab` and its SHA-256 file. It is a release build, not signed with a production upload key. It is not directly installable like an APK. APK, AAB and PWA use the same responsive live game and preserve the existing application ID.

Before Play Store submission, sign the AAB using your own persistent upload key and complete the Play Console listing, data-safety and current Android target-API requirements. The current project targets API 36; review the current Play Console requirement before upload. No release key or password is stored in this repository. Do not use the test APK's debug key for a production release.

For a local signing workflow, `jarsigner -keystore /path/to/your-upload-key.jks -signedjar Rope-Skipping-Challenge-release-signed.aab Rope-Skipping-Challenge-release-unsigned.aab YOUR_UPLOAD_ALIAS` prompts for your password without placing it in shell arguments. Keep the key and passwords outside Git.
