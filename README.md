# SaaS Content Studio 🚀

> High-velocity SaaS content engine powered by your own real logged-in browser sessions of **ChatGPT** (`chatgpt.com`), **Google Gemini** (`gemini.google.com`), and **Google Flow** (`labs.google/flow`) — without API token billing, rate limits, or bot blocks.

---

## 📌 Architecture Overview

```
saas-content-studio/
├── apps/
│   ├── extension/                    # Manifest V3 Chrome Extension (WXT + React 19)
│   │   ├── entrypoints/
│   │   │   ├── background.ts         # Service worker job runner & rate limiter
│   │   │   ├── bridge.content.ts     # Localhost handshake & message bridge
│   │   │   ├── chatgpt.content.ts    # ChatGPT DOM interaction script
│   │   │   ├── gemini.content.ts     # Gemini Quill editor interaction script
│   │   │   ├── flow.content.ts       # Google Flow video generation script
│   │   │   └── sidepanel/            # Live queue, logs, and manual takeover panel
│   │   ├── src/
│   │   │   ├── adapters/             # SiteAdapter implementations (ChatGPT, Gemini, Flow)
│   │   │   │   └── selectors/        # JSON selector registries (chatgpt.json, gemini.json, flow.json)
│   │   │   └── utils/
│   │   │       ├── dom-interactions.ts # React/ProseMirror typing emulation (15-45ms jitter)
│   │   │       └── ai-locator.ts     # Semantic A11y fallback locator & health check
│   │   └── .output/chrome-mv3        # Unpacked distribution ready to load in Chrome
│   │
│   └── web/                          # Next.js 15 App Router + Tailwind CSS + SQLite + Drizzle
│       ├── src/
│       │   ├── app/
│       │   │   ├── page.tsx          # Pinterest-aesthetic unified dashboard
│       │   │   └── api/              # Ingest, brief, templates, library, pipelines, health
│       │   ├── components/           # Pinterest pins, Side-by-Side Arena, Brief Studio, Pipelines
│       │   └── lib/
│       │       ├── db/               # SQLite client & Drizzle schema (Postgres-compatible)
│       │       ├── ingestion/        # GitHub crawler, @mozilla/readability, PDF/DOCX parsers
│       │       └── extension-client.ts # Bidirectional chrome.runtime & bridge client
│       ├── Dockerfile                # Production container deployment
│       └── vercel.json               # Vercel deployment configuration
│
└── packages/
    └── shared/                       # Shared TypeScript protocols, types & constants
```

---

## ⚡ Quick Start

### 1. Run the Studio (Localhost)
Using the pre-configured launcher:
```powershell
# Windows 1-Click Launcher:
.\start-studio.bat
```
Or via pnpm:
```bash
pnpm install
pnpm build
pnpm --filter @scs/web start
```
The dashboard will be active at: **[http://localhost:3000](http://localhost:3000)**

### 2. Load the Extension in Chrome
1. Open Google Chrome and navigate to `chrome://extensions`.
2. Toggle on **Developer mode** in the top-right corner.
3. Click **Load unpacked** and select:
   ```
   apps/extension/.output/chrome-mv3
   ```
4. Pin **SaaS Content Studio** to your Chrome toolbar.
5. Open the **Side Panel** anytime by clicking the extension icon.

---

## 🔑 Session Logins & Readiness

SaaS Content Studio never asks for or stores your passwords. It operates safely inside your real Chrome profile:

| Platform | URL | What to verify |
| :--- | :--- | :--- |
| **ChatGPT** | `https://chatgpt.com` | Ensure you are logged into your ChatGPT Plus or free account. |
| **Google Gemini** | `https://gemini.google.com/app` | Ensure you are signed in with your Google account. |
| **Google Flow** | `https://labs.google/flow` | Ensure you have access to Google Labs / Flow canvas. |

> [!NOTE]
> When executing a job, the extension opens or focuses a **visible Chrome tab** so you can watch execution live. Headless flags are strictly forbidden.

---

## 🛡️ Safety & Reliability Suite

1. **Human Keystroke Jitter (15–45ms):** Types realistic chunks and dispatches native `beforeinput`, `input`, and `change` events so React, ProseMirror, and Quill pick them up naturally.
2. **Rate Limiting:** Enforces maximum jobs per hour (default 20/hr for ChatGPT and Gemini; 15/hr for Flow) to avoid bot detection.
3. **Manual Takeover (Side Panel):** If a CAPTCHA, login challenge, or modal appears, the extension pauses immediately, notifies you in the side panel, and waits for you to click **"Resume"**.
4. **AI-Locator Fallback:** If a site changes its HTML, the semantic A11y heuristic inspects the accessibility tree, locates the right element, and logs the occurrence.

---

## 🔍 How to Run the Selector Health Check

To verify that all DOM selectors on ChatGPT, Gemini, and Flow are valid:
1. Open [http://localhost:3000](http://localhost:3000).
2. Go to the **🎬 Flow Pipelines** section and switch to the **"Health & Selectors"** tab.
3. Click **"Run Selector Audit"**.
4. The system validates all primary selectors against active site structures and returns a health score (e.g., `100% OPERATIONAL`).

---

## ➕ How to Add a New Site Adapter

Adding support for another platform (such as **Claude.ai**, **Perplexity.ai**, or **Canva**) takes 3 steps:

### 1. Create Selector JSON
Add `apps/extension/src/adapters/selectors/claude.json`:
```json
{
  "selectors": {
    "composer": "div[contenteditable='true']",
    "sendButton": "button[aria-label*='Send Message']",
    "stopButton": "button[aria-label*='Stop generating']",
    "newChatButton": "a[href*='/new']",
    "responseContainer": "div[data-message-author-role='assistant']"
  }
}
```

### 2. Implement the SiteAdapter Interface
Create `apps/extension/src/adapters/claude-adapter.ts`:
```typescript
import { SiteAdapter } from '@scs/shared';

export class ClaudeAdapter implements SiteAdapter {
  site = 'claude' as const;
  async isReady() { /* check login & composer */ }
  async newChat() { /* click new chat */ }
  async sendPrompt(text: string) { /* type with typeHumanLike */ }
  async waitForCompletion() { /* monitor streaming stop */ }
  async extractResult() { /* extract via Turndown */ }
}
```

### 3. Create Content Script
Add `apps/extension/entrypoints/claude.content.ts`:
```typescript
export default defineContentScript({
  matches: ['https://claude.ai/*'],
  main() {
    // Route EXECUTE_CLAUDE_JOB to ClaudeAdapter
  }
});
```

---

## 📦 Production Deployment

### Option A: Localhost Desktop Deployment
```powershell
.\start-studio.bat
```

### Option B: Docker Container
```bash
docker-compose up --build -d
```
Runs the Next.js web application and persistent SQLite database inside a production-grade Docker container exposed on port 3000.

### Option C: Vercel / Cloud
Push your branch to GitHub and import into Vercel. SQLite will run with LibSQL/Turso cloud compatibility configured via `@libsql/client`.

---

## 🎯 Phased Milestone Checklist

- [x] **Step 1:** Monorepo scaffold, Chrome Manifest V3 extension, bidirectional messaging round trip.
- [x] **Step 2:** ChatGPT adapter end-to-end ("Say hello" -> SQLite DB).
- [x] **Step 3:** Google Gemini adapter + Side-by-Side Comparison Arena.
- [x] **Step 4:** Multi-source ingestion (GitHub, Docs URLs, PDF/DOCX, Notes) & executive Product Brief.
- [x] **Step 5:** 9 Content templates & searchable SQLite generation library.
- [x] **Step 6:** Google Flow video adapter (project creation, polling, MP4 download).
- [x] **Step 7:** Chained pipelines, AI-locator fallback, selector health audit, rate limits, manual takeover.
- [x] **Step 8:** Production deployment documentation, zip packaging, and Docker configurations.

---

### License
MIT &copy; 2026 SaaS Content Studio. Created for high-velocity indie founders and growth engineers.
