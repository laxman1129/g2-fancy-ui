# A1 Disruption Optimizer · G2

Airline disruption management app for Even Realities G2 smart glasses. An operations controller steps through a 5-screen workflow on the G2 display — disruption alert → strategy selection → flight-level comparison → review → publish — using only tap, scroll, and double-tap via the G2 ring.

## Screens

| Screen | Trigger | Content |
|---|---|---|
| **HOME** | Launch | Storm cell MC-47 · 47 flights · 2,140 PAX · 4 strategies ready |
| **OPTIONS** | Tap → Run Optimizer | 4 recovery strategies (A–D) with cost + PAX trade-offs; scroll to select |
| **COMPARISON** | Select strategy | Flight-level Do-Nothing vs Proposed table for all 10 affected flights |
| **REVIEW** | Tap any flight | ↓ $198k saved · −34h delay · 84% PAX resolved · 1 exception · 1 open |
| **PUBLISH** | Tap → Publish | Crew/FOC/GDS confirmations + exception flags; Tap to confirm |
| **DONE** | Confirm | Plan reference, PAX count notified, crew updated |

## Architecture

```
src/
  main.ts     — G2 bridge logic + canvas/UPNG display renderer + companion UI
  data.ts     — All screen content (HOME, STRATEGIES, FLIGHTS, REVIEW, PUBLISH, DONE)
  upng-js.d.ts — Type declarations for upng-js
```

> **Note:** `paginate.ts` and `sample.ts` were removed — the pagination logic is no longer used.

**G2 bridge** (`@evenrealities/even_hub_sdk`): Three persistent containers — title bar (28px), body (208px), nav bar (28px). List screens (OPTIONS, COMPARISON) swap the body for a `ListContainerProperty`. All bridge writes are serialised through a promise chain so BLE round-trips never overlap.

**Display renderer**: Each companion mirror update renders the current screen to an offscreen 576×288 canvas using `JetBrains Mono` with an avionics colour palette (aviation cyan `#5BC4F5`, status green/amber/red), then encodes the pixel data losslessly via **UPNG.js** to a PNG data URL. The `<img>` element shows a pixel-perfect simulation of what appears on the glasses, with a CSS scanline overlay for realism.

**Companion mirror** (web UI): Served by Vite at `http://localhost:5173`. Shows:
- Progress stepper (HOME → OPTIONS → COMPARISON → REVIEW → PUBLISH → DONE)
- UPNG-rendered G2 display
- Four gesture buttons (Tap, Double-tap, Scroll ↑↓)

## Recent updates

### Bug fix — outdated dependencies

The previous dependency versions (`even_hub_sdk@^0.0.10`, `vite@^5.4.0`) caused build failures and runtime issues with the G2 bridge. Updating to the latest versions resolved:

- **SDK 0.0.14** — fixes container upgrade and BLE serialization bugs
- **Vite 8.2.2** — resolves esbuild/rollup compatibility issues on macOS ARM
- **Removed `@evenrealities/pretext`** — unused text measurement library

Run `npm install` to pull the corrected dependencies.

## Quick start

```bash
npm install
npm run dev        # companion mirror at http://localhost:5173
npm run simulate   # attach evenhub-simulator
npm run pack       # build + pack for G2 sideload
```

## Private testing (create & upload the .ehpk)

Follow the official flow from the [Even Hub docs — Private Testing](https://hub.evenrealities.com/docs/test/private-testing):

```bash
# 1. Build your production bundle
npm run build

# 2. Pack it into .ehpk
evenhub pack app.json dist -o myapp.ehpk
```

Then, in the dev portal **hub.evenrealities.com/login**:

1. Open your project → **Private builds** tab.
2. Upload `myapp.ehpk`.
3. On your phone, open the **Even Realities** app → **Even Hub** tab (Developer Mode).
4. **Me → Apps → Private builds** → tap **Install**.

Within a few seconds the build is on your glasses. Launch it from the glasses home, the same way a Released app launches.

> **Note:** Private testing exercises the full `.ehpk` packaging path (manifest validation, permission prompts, real launch UX) but has no HMR — every code change is a full build, re-upload, and re-install. Use [Beta Testing](https://hub.evenrealities.com/docs/test/beta-testing) to validate the 5-minute locked-phone lifecycle before submitting for review.

## Deploy to Even Hub

```bash
npx evenhub login      # authenticate with your Even Hub account
npx evenhub upload dist/*.ehpk  # publish app to your dashboard
```

## Deploy to G2 glasses via QR code

> Prerequisites: Even Realities companion app installed on your phone, G2 glasses paired and on the same Wi-Fi network as your Mac.

**Step 1 — Build and pack**

```bash
npm run build          # TypeScript compile + Vite bundle → dist/
npm run pack           # evenhub pack app.json dist → dist/*.ehpk
```

The `pack` script generates an `.ehpk` file in the `dist/` directory.

**Step 2 — Upload to Even Hub**

```bash
npx evenhub login      # authenticate with your Even Hub account
npx evenhub upload dist/*.ehpk
```

This publishes the app to your Even Hub dashboard. The app will be available for installation on your G2 glasses.

**Alternative: Sideload via QR code**

If you prefer to sideload directly over Wi-Fi:

**Step 2a — Start the dev server** (if not already running)

```bash
npm run dev            # serves on http://localhost:5173
```

**Step 2b — Generate the QR code**

Point the QR at your machine's local IP so the glasses can reach it over Wi-Fi:

```bash
# Auto-detect local IP, default port 5173
npx evenhub qr

# Or specify explicitly
npx evenhub qr --ip 192.168.x.x --port 5173

# Print large in terminal (scale 8)
npx evenhub qr --scale 8
```

The QR code prints directly in the terminal. To open it as an image instead:

```bash
npx evenhub qr --external
```

**Step 2c — Sideload via the Even Realities app**

1. Open the **Even Realities** companion app on your phone
2. Tap **Explore** → **Scan QR** (or the QR icon in the top-right)
3. Scan the QR code from the terminal
4. Tap **Install** — the app transfers over BLE/Wi-Fi to the glasses
5. On the G2, navigate to **Apps** and launch **A1 Disruption Optimizer**

**Step 3 — Interact**

| Ring gesture | Action |
|---|---|
| Single tap | Advance / confirm |
| Double-tap | Back / exit |
| Scroll down | Next strategy (OPTIONS screen) |
| Scroll up | Previous strategy (OPTIONS screen) |

> **Tip:** keep `npm run dev` running while on the glasses — the companion mirror at `http://localhost:5173` shows a live pixel-accurate preview of the G2 display.

## Gestures

| Ring gesture | Action |
|---|---|
| Single tap | Advance / confirm |
| Double-tap | Back / exit |
| Scroll down | Next strategy (OPTIONS only) |
| Scroll up | Previous strategy (OPTIONS only) |
| List item tap (G2) | Select strategy or open review |

## Colour palette

| Token | Hex | Use |
|---|---|---|
| Aviation cyan | `#5BC4F5` | Title text, active selection, headers |
| Status green | `#3DD68C` | Resolved flights, savings, confirmations |
| Amber | `#F5A623` | Warnings, crew exceptions |
| Red | `#E05050` | Open/unresolved items |
| Gold | `#F5C842` | Recommended strategy star |
