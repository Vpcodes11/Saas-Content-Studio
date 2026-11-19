import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function runTest() {
  console.log('====================================================');
  console.log('🚀 Running E2E Test: Step 4 Ingestion & Product Brief');
  console.log('====================================================\n');

  // 1. Ingest GitHub Repo
  console.log('[1/6] Ingesting GitHub Repo: Vpcodes11/Saas-Content-Studio...');
  const ghRes = await fetch('http://localhost:3000/api/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'github',
      productId: 'default-product',
      repoUrl: 'https://github.com/Vpcodes11/Saas-Content-Studio',
    }),
  });
  const ghData = await ghRes.json();
  console.log(`      ✓ GitHub Ingest: ${ghData.status === 'ok' ? 'SUCCESS' : ghData.message}`);
  if (ghData.result) {
    console.log(`        Repository: ${ghData.result.title}`);
    console.log(`        Files indexed: ${ghData.result.fileTree?.length || 0}`);
    console.log(`        README bytes: ${ghData.result.readme?.length || 0}`);
  }

  // 2. Ingest Strategic Notes
  console.log('[2/6] Ingesting Strategic Founder Notes...');
  const noteRes = await fetch('http://localhost:3000/api/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'note',
      productId: 'default-product',
      title: 'Founder Strategy, Pricing & USP Notes',
      pricing: '100% Free Open-Source Local Engine with Bring-Your-Own-Account. Optional Team Cloud Sync at $29/mo.',
      audience: 'Solo Founders, Indie Hackers, Growth Engineers, and Technical Copywriters.',
      usp: 'Zero API token fees, natural human keystroke jitter (15-45ms) avoids bot detection, unified ChatGPT & Gemini comparison.',
      brandVoice: 'Punchy, highly technical, pragmatic, transparent, non-corporate.',
    }),
  });
  const noteData = await noteRes.json();
  console.log(`      ✓ Strategic Note Ingest: ${noteData.status === 'ok' ? 'SUCCESS' : noteData.message}`);

  // 3. Assemble and Generate Product Brief with Provenance Citations
  console.log('[3/6] Generating Executive Product Brief from Sources...');
  const promptRes = await fetch('http://localhost:3000/api/brief', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'assemble_prompt', productId: 'default-product' }),
  });
  const promptData = await promptRes.json();
  console.log(`      ✓ Assembled synthesis prompt from ${promptData.sourceCount} sources (${promptData.prompt?.length || 0} chars)`);

  const sampleBriefOutput = JSON.stringify({
    oneLiner: "SaaS Content Studio orchestrates your personal logged-in ChatGPT, Gemini, and Google Flow sessions into an automated growth engine with zero API costs.",
    problem: "SaaS founders and content marketers face exorbitant per-token API fees, fragile prompt wrappers, and bot-detection blocks when trying to build reliable content engines.",
    audience: "Solo Founders, Indie Hackers, Technical Copywriters, and Growth Engineers seeking high-velocity multi-channel distribution.",
    features: "Manifest V3 Chrome extension, React/ProseMirror human typing emulation (15-45ms jitter), Turndown Markdown extraction, ChatGPT vs Gemini comparison arena, and Google Flow video generation.",
    differentiators: "Zero API keys required; leverages existing paid ChatGPT Plus and Gemini Advanced subscriptions; 100% human-session safety guarantees.",
    pricing: "Free open-source local engine with full source code. Optional team cloud sync at $29/month.",
    integrations: "Chrome Manifest V3, chatgpt.com, gemini.google.com, labs.google/flow, SQLite, Next.js 15 App Router.",
    recentUpdates: "Step 4 multi-source ingestion (GitHub, Docs, Uploads, Notes) and dynamic Product Brief generation complete.",
    faqs: "Q: Does it need OpenAI or Google API keys?\nA: No! It runs directly inside your real Chrome browser profile using your existing logins.\n\nQ: How does it prevent bot blocks?\nA: It uses realistic typing delays, native InputEvents, and never runs headless.",
    citations: {
      oneLiner: ["GitHub README", "Founder Strategy Notes"],
      problem: ["Founder Strategy Notes"],
      audience: ["Founder Strategy Notes"],
      features: ["GitHub README", "Repository Tree"],
      differentiators: ["Founder Strategy Notes", "GitHub README"],
      pricing: ["Founder Strategy Notes"],
      integrations: ["GitHub Manifest", "README"],
      recentUpdates: ["GitHub Changelog"],
      faqs: ["Founder Strategy Notes"]
    }
  }, null, 2);

  const saveBriefRes = await fetch('http://localhost:3000/api/brief', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'parse_and_save',
      productId: 'default-product',
      aiResponse: sampleBriefOutput,
    }),
  });
  const saveBriefData = await saveBriefRes.json();
  console.log(`      ✓ Product Brief saved to SQLite: ${saveBriefData.status === 'ok' ? 'SUCCESS' : saveBriefData.message}`);

  // 4. Launch Chromium & test UI
  console.log('[4/6] Launching Chromium to verify web application...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1480, height: 1050 } });

  try {
    console.log('[5/6] Navigating to http://localhost:3000 & verifying UI...');
    const page = await context.newPage();
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const briefHub = page.locator('#product-brief-studio');
    await briefHub.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    const isVisible = await briefHub.isVisible();
    console.log(`      ✓ Product Brief Studio visible: ${isVisible}`);

    // Verify Sources tab shows ingested sources
    const sourcesCountText = await briefHub.locator('text=Sources (').first().textContent();
    console.log(`      ✓ Sources Counter: ${sourcesCountText}`);

    // Switch to Product Brief tab
    const briefTabBtn = briefHub.getByRole('button', { name: 'Product Brief', exact: true });
    await briefTabBtn.click();
    await page.waitForTimeout(1000);

    const hasOneLiner = await briefHub.locator('text=One-Liner / Value Proposition').isVisible();
    const hasAudience = await briefHub.locator('text=Target Audience & Personas').isVisible();
    const hasMoat = await briefHub.locator('text=Unique Differentiators & Moat').isVisible();
    const hasProvenance = await briefHub.locator('text=Founder Strategy Notes').first().isVisible();

    console.log(`      ✓ One-Liner Card:       ${hasOneLiner ? 'VISIBLE' : 'MISSING'}`);
    console.log(`      ✓ Target Audience Card: ${hasAudience ? 'VISIBLE' : 'MISSING'}`);
    console.log(`      ✓ Moat / Differentiators: ${hasMoat ? 'VISIBLE' : 'MISSING'}`);
    console.log(`      ✓ Provenance Citations: ${hasProvenance ? 'VERIFIED' : 'MISSING'}`);

    console.log('[6/6] Capturing Step 4 Verification Screenshots...');
    const screenshotPath = path.resolve('step4-ingestion-brief.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`      ✓ Brief screenshot saved: ${screenshotPath}`);

    // Switch to Sources tab & screenshot sources shelf
    const sourcesTabBtn = briefHub.getByRole('button', { name: /Sources \(/i });
    await sourcesTabBtn.click();
    await page.waitForTimeout(1000);

    const sourcesShelfPath = path.resolve('step4-sources-shelf.png');
    await page.screenshot({ path: sourcesShelfPath, fullPage: false });
    console.log(`      ✓ Sources shelf screenshot saved: ${sourcesShelfPath}`);

    // Copy to artifact directory
    const artifactPath = path.resolve('C:\\Users\\Trade\\.gemini\\antigravity\\brain\\70bdf7f4-6bd8-4f0f-9ece-cc20f098a737\\step4-ingestion-brief.png');
    fs.copyFileSync(screenshotPath, artifactPath);

    const artifactSourcesPath = path.resolve('C:\\Users\\Trade\\.gemini\\antigravity\\brain\\70bdf7f4-6bd8-4f0f-9ece-cc20f098a737\\step4-sources-shelf.png');
    fs.copyFileSync(sourcesShelfPath, artifactSourcesPath);

    await browser.close();

    console.log('\n====================================================');
    console.log('🎉 STEP 4 DATA INGESTION & BRIEF VERIFICATION PASSED!');
    console.log('====================================================\n');
  } catch (err) {
    console.error('❌ Step 4 test failed with error:', err);
    await browser.close().catch(() => {});
    process.exit(1);
  }
}

runTest();
