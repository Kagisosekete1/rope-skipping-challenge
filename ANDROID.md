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

This is a **debug-signed Android test build**, application ID `com.seketefilms.ropeskipping`, version 3.0.0, minimum Android 6 (API 23), target API 35. A compatible modern Android WebView with Canvas 2D is required. It uses Capacitor to open the live HTTPS game. It is a website-backed Android app, not a self-contained offline native port. The native launcher uses matching original Cartoon Edition artwork.

You can send the APK file or its download link through a sharing platform. Android may ask you to allow installation from your chosen browser/file app. A Play Store release needs your own persistent release-signing key and store setup; this test build is not a store submission.

## Rebuild

Requirements: Node 22.12+, JDK 21 with `javac`, Android SDK platform 35 and Build Tools 34/35, accepted Android SDK licenses, and `ANDROID_HOME` set to your SDK directory. Gradle downloads dependencies from its official repositories. `JAVA_HOME` should point to the JDK.

```sh
npm ci
npm run android:build
npm run build
```

The build helper syncs Capacitor, creates a local debug keystore if absent, builds the APK, and copies it plus a SHA-256 checksum into `public/downloads/`. The keystore, local SDK paths, Gradle caches and build directories are ignored by Git. Keep production release keys outside the repository.

The supplied test APK has been compiled and its package/signature checked. It has not been installed and played on a physical Android phone in this session.
