# Play Store submission checklist

## Done (in this repo / already deployed)

- [x] **App identity** — package `mka.declare.app`, versionCode 1, versionName "1.0"
- [x] **Hi-res icon** — `hi-res-icon-512.png` (512x512, 32-bit PNG with alpha)
- [x] **Feature graphic** — `feature-graphic.jpg` (1024x500)
- [x] **App icon + adaptive icon** — already in the app itself, generated from the same brand mark
- [x] **Splash screen** — rebranded with the logo + wordmark on the brand gradient
- [x] **Store listing copy** — `store-listing.md` (short + full description, category, contact)
- [x] **Privacy Policy** — live at https://declare-cyan.vercel.app/privacy
- [x] **Data safety form answers** — `data-safety-form.md` (exact answers for Play Console's form)
- [x] **Signed release build pipeline** — `.github/workflows/build-android-release.yml`, run manually via `gh workflow run build-android-release.yml` (or the Actions tab), produces a signed `.aab`
- [x] **Release keystore** — generated, stored as GitHub Actions secrets (`ANDROID_RELEASE_KEYSTORE_BASE64` and friends). **You should also have received the raw keystore file + password directly — back that up somewhere safe (password manager or encrypted storage). If it's ever lost, Google Play App Signing (which you'll opt into on first upload) lets you request a reset; without that opt-in, losing it means you can never update the app again.**

## Still needed — screenshots

Play Store requires 2-8 phone screenshots (16:9 to 9:16 aspect, 320px-3840px). I generated a landing-page screenshot, but it has a dev-tool watermark and isn't representative of the actual app experience — Play Store listings do better with real in-app screens anyway. Please grab 3-4 screenshots directly from your phone (you're already logged in there):
- Dashboard (upcoming services / unfilled positions)
- Roles page (or a service's People tab, showing assignments)
- A service detail page
- The People/roster page

Save them into `play-store-assets/screenshots/` in this repo, or just hand them to me and I'll place them.

## Steps only you can do (Play Console is tied to your own Google account)

1. **Create a Google Play Developer account** — one-time $25 fee, at https://play.google.com/console/signup. I can't create accounts or pay on your behalf.
2. **Create the app listing** in Play Console, upload the AAB from the release workflow, the feature graphic, hi-res icon, and screenshots above.
3. **Opt into Google Play App Signing** when prompted during the first upload (strongly recommended — see the keystore note above).
4. **Fill in the Data safety section** using `data-safety-form.md` as your answer key.
5. **Complete the Content rating questionnaire** — Declare has no user-generated public content, violence, or mature themes, so this should land in the lowest rating tier, but the questionnaire itself has to be answered by you in Play Console.
6. **Target audience & content declaration** — Declare isn't directed at children.
7. **App category** — Productivity or Business (your call, both fit).
8. **Submit for review.**

## Getting the signed AAB

The release workflow only runs when you trigger it (deliberately — not on every push like the debug APK). To get a fresh one after any app change:

```bash
gh workflow run build-android-release.yml
```

Then download the `declare-release-aab` artifact from the finished run (Actions tab, or `gh run download`).

**Before your first Play Store upload**, and before any update after that, bump `versionCode` (and usually `versionName`) in `android/app/build.gradle` — Play Store rejects an upload whose versionCode isn't higher than the last one.
