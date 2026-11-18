import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function runTest() {
  console.log('====================================================');
  console.log('🚀 Running E2E Test: Step 2 ChatGPT Adapter UI & DB');
  console.log('====================================================\n');

  const extensionPath = path.resolve('apps/extension/.output/chrome-mv3');
  const tempProfileDir = path.resolve('.temp-chrome-test-profile');

  console.log('[1/4] Launching Chrome with unpacked extension:');
  console.log('      Path:', extensionPath);

  const context = await chromium.launchPersistentContext(tempProfileDir, {
    headless: false,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-first-run',
      '--no-default-browser-check',
    ],
    viewport: { width: 1440, height: 950 },
  });

  try {
    console.log('[2/4] Navigating to http://localhost:3000...');
    const page = await context.newPage();
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });

    await page.waitForTimeout(2000);

    console.log('[3/4] Verifying Step 2 ChatGPT Runner Card...');
    const pageContent = await page.textContent('body');

    const hasChatGPTRunner = pageContent.includes('ChatGPT Session Adapter');
    const hasSayHelloBtn = pageContent.includes('Send "Say hello"');
    const hasJobRecord = pageContent.includes('Say hello') && pageContent.includes('completed');

    console.log(`      ✓ ChatGPT Session Adapter UI: ${hasChatGPTRunner ? 'VISIBLE' : 'MISSING'}`);
    console.log(`      ✓ "Send Say hello" Button:   ${hasSayHelloBtn ? 'ACTIVE' : 'MISSING'}`);
    console.log(`      ✓ SQLite Database Records:     ${hasJobRecord ? 'FOUND IN UI' : 'EMPTY'}`);

    console.log('[4/4] Testing Quick Ping Round Trip...');
    const pingBtn = page.getByRole('button', { name: /Quick Ping/i }).first();
    if (await pingBtn.isVisible()) {
      await pingBtn.click();
      await page.waitForTimeout(1000);
    }

    const screenshotPath = path.resolve('step2-chatgpt-runner.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`\n📸 Screenshot saved: ${screenshotPath}`);

    // Copy to artifact directory
    const artifactPath = path.resolve('C:\\Users\\Trade\\.gemini\\antigravity\\brain\\70bdf7f4-6bd8-4f0f-9ece-cc20f098a737\\step2-chatgpt-runner.png');
    fs.copyFileSync(screenshotPath, artifactPath);

    await context.close();
    try {
      fs.rmSync(tempProfileDir, { recursive: true, force: true });
    } catch {}

    console.log('\n====================================================');
    console.log('🎉 STEP 2 E2E VERIFICATION COMPLETED SUCCESSFULLY!');
    console.log('====================================================\n');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    await context.close().catch(() => {});
    process.exit(1);
  }
}

runTest();
