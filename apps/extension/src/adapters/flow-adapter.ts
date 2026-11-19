import { SiteAdapter } from '@scs/shared';
import flowConfig from './selectors/flow.json';
import { findFirstElement, isVisible, sleep, randomJitter, typeHumanLike, clickHumanLike } from '../utils/dom-interactions';

export class FlowAdapter implements SiteAdapter {
  site = 'flow' as const;
  private config = flowConfig;

  async isReady(): Promise<{ isReady: boolean; isLoggedIn: boolean; error?: string }> {
    // Check for CAPTCHA
    const captcha = findFirstElement(this.config.captcha);
    if (captcha && isVisible(captcha)) {
      return {
        isReady: false,
        isLoggedIn: false,
        error: 'CAPTCHA_DETECTED: A bot challenge was detected on Google Flow. Please complete it in your open tab.',
      };
    }

    // Check for Sign in wall
    const authWall = findFirstElement(this.config.authWall);
    if (authWall && isVisible(authWall)) {
      return {
        isReady: false,
        isLoggedIn: false,
        error: 'LOGIN_REQUIRED: Please sign in to Google Flow (labs.google/flow) with your Google account.',
      };
    }

    // Check for scene prompt input or new project button
    const promptInput = findFirstElement(this.config.scenePromptInput);
    const newProjectBtn = findFirstElement(this.config.newProjectBtn);
    if ((promptInput && isVisible(promptInput)) || (newProjectBtn && isVisible(newProjectBtn))) {
      return { isReady: true, isLoggedIn: true };
    }

    // Allow up to 4s for client hydration
    for (let i = 0; i < 8; i++) {
      await sleep(500);
      const retryInput = findFirstElement(this.config.scenePromptInput);
      const retryBtn = findFirstElement(this.config.newProjectBtn);
      if ((retryInput && isVisible(retryInput)) || (retryBtn && isVisible(retryBtn))) {
        return { isReady: true, isLoggedIn: true };
      }
    }

    return {
      isReady: false,
      isLoggedIn: false,
      error: 'FLOW_CANVAS_NOT_FOUND: Could not detect the Google Flow project workspace.',
    };
  }

  async newChat(): Promise<void> {
    const newProjectBtn = findFirstElement(this.config.newProjectBtn);
    if (newProjectBtn && isVisible(newProjectBtn)) {
      await clickHumanLike(newProjectBtn);
      await sleep(randomJitter(1000, 2000));
    }
  }

  async sendPrompt(text: string): Promise<void> {
    let inputEl = findFirstElement(this.config.scenePromptInput);

    // If on home screen, click new project first
    if (!inputEl) {
      await this.newChat();
      inputEl = findFirstElement(this.config.scenePromptInput);
    }

    if (!inputEl) {
      throw new Error('Google Flow scene prompt input could not be found.');
    }

    inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await sleep(randomJitter(300, 600));

    // Focus & human typing emulation
    inputEl.focus();
    await typeHumanLike(inputEl as HTMLElement, text);
    await sleep(randomJitter(600, 1200));

    // Find and click Generate button
    const generateBtn = findFirstElement(this.config.generateBtn);
    if (generateBtn && isVisible(generateBtn)) {
      await clickHumanLike(generateBtn);
      await sleep(randomJitter(1000, 2000));
    } else {
      // Try Enter key
      inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
      inputEl.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true }));
    }
  }

  async waitForCompletion(timeoutMs = 180000): Promise<void> {
    const startTime = Date.now();
    await sleep(2000); // Initial grace period for rendering to start

    while (Date.now() - startTime < timeoutMs) {
      // 1. Check if CAPTCHA popped up
      const captcha = findFirstElement(this.config.captcha);
      if (captcha && isVisible(captcha)) {
        throw new Error('CAPTCHA_DETECTED: Google bot verification appeared during video rendering.');
      }

      // 2. Check if video player element exists and has loaded source
      const videoEl = findFirstElement(this.config.videoPlayer) as HTMLVideoElement | null;
      if (videoEl && (videoEl.src || videoEl.currentSrc || videoEl.querySelector('source')?.getAttribute('src'))) {
        const isGenerating = findFirstElement(this.config.renderingIndicator);
        if (!isGenerating || !isVisible(isGenerating)) {
          // Video rendered!
          await sleep(2000);
          return;
        }
      }

      // 3. Check if download button has appeared
      const downloadBtn = findFirstElement(this.config.downloadBtn);
      if (downloadBtn && isVisible(downloadBtn)) {
        await sleep(1000);
        return;
      }

      await sleep(1500);
    }

    throw new Error(`Google Flow video generation timed out after ${Math.round(timeoutMs / 1000)} seconds.`);
  }

  async extractResult(): Promise<{ markdown: string; mediaUrls?: string[] }> {
    const videoEl = findFirstElement(this.config.videoPlayer) as HTMLVideoElement | null;
    const mediaUrls: string[] = [];

    let videoSrc = '';
    let posterUrl = '';

    if (videoEl) {
      videoSrc = videoEl.src || videoEl.currentSrc || videoEl.querySelector('source')?.getAttribute('src') || '';
      posterUrl = videoEl.poster || '';
      if (videoSrc) mediaUrls.push(videoSrc);
      if (posterUrl) mediaUrls.push(posterUrl);
    }

    // Try finding direct download link
    const downloadLink = document.querySelector('a[download]') as HTMLAnchorElement | null;
    if (downloadLink?.href && !mediaUrls.includes(downloadLink.href)) {
      mediaUrls.push(downloadLink.href);
    }

    const md = `### 🎬 Google Flow Generated Video Scene\n\n` +
      `- **Video Output:** ${videoSrc ? `[View Video Clip](${videoSrc})` : 'Generated successfully in Google Flow session'}\n` +
      `- **Poster Preview:** ${posterUrl ? `![Poster](${posterUrl})` : 'Available in Flow canvas'}\n` +
      `- **Timestamp:** ${new Date().toISOString()}\n\n` +
      `*Clip ready for pipeline assembly.*`;

    return {
      markdown: md,
      mediaUrls,
    };
  }
}
