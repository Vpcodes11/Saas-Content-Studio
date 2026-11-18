# SaaS Content Studio

> AI content generation powered by your own real logged-in browser sessions of **ChatGPT** (`chatgpt.com`), **Gemini** (`gemini.google.com`), and **Google Flow** (`labs.google/flow`) — without API fees, headless bans, or bot blocks.

---

## Architecture Overview

```
saas-content-studio/
├── apps/
│   ├── extension/          # Manifest V3 Chrome Extension (WXT + React 19)
│   │   ├── entrypoints/
│   │   │   ├── background.ts       # Service worker & external message runner
│   │   │   ├── bridge.content.ts   # Localhost handshake & message bridge
│   │   │   └── sidepanel/          # Side panel UI with manual takeover button
│   │   └── .output/chrome-mv3      # Ready-to-load unpacked Chrome extension
│   └── web/                # Next.js 15 App Router + Tailwind + SQLite + Drizzle
│       ├── src/lib/db/     # SQLite database with Drizzle schema
│       └── src/app/        # Interactive dashboard & extension tester
└── packages/
    └── shared/             # TypeScript types, message protocols & constants
```

---

## Step 1: Verification & Testing Guide

### 1. Start the Web Dashboard
```bash
pnpm --filter @scs/web dev
# or if built:
pnpm --filter @scs/web start
```
The web dashboard is live at: [http://localhost:3000](http://localhost:3000)

### 2. Load the Unpacked Extension in Chrome
1. Open Google Chrome and go to: `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select the directory:
   ```
   c:\Users\Trade\OneDrive\Desktop\Antigravity Projects\Saas content Studio\apps\extension\.output\chrome-mv3
   ```
5. Note the generated Extension ID in Chrome (e.g. `abcdefghijklmnop...`).

### 3. Test the Ping Round Trip
1. Navigate to [http://localhost:3000](http://localhost:3000).
2. The page will automatically detect the extension via the bridge content script.
3. Click **"Send Ping to Extension"**.
4. The web dashboard will send a `PING` to the extension's service worker and receive a `PONG` response with:
   - Measured round-trip latency in milliseconds (e.g., `3–6ms`)
   - Extension version
   - Runner status (`idle` / `paused`)
   - Supported site adapters (`chatgpt`, `gemini`, `flow`)
5. Click the extension icon in your Chrome toolbar or right-click to open the **Side Panel** to inspect the live event log and test the **"Pause / Take Over Control"** button.

---

## Build Roadmap
- [x] **Step 1:** Monorepo scaffold, unpacked extension, web app ↔ extension messaging ("ping" round trip)
- [ ] **Step 2:** ChatGPT adapter end-to-end ("Say hello" -> DB)
- [ ] **Step 3:** Gemini adapter + side-by-side compare
- [ ] **Step 4:** Data ingestion + Product Brief
- [ ] **Step 5:** Content templates + generation library
- [ ] **Step 6:** Google Flow video adapter (project creation, polling, download)
- [ ] **Step 7:** Pipelines, AI-locator fallback, selector health check, rate limits, side-panel takeover
- [ ] **Step 8:** Documentation & Production Polish
