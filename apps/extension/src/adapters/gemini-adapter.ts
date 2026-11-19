import TurndownService from 'turndown';
import { SiteAdapter, SiteSelectorConfig } from '@scs/shared';
import geminiConfig from './selectors/gemini.json';
import { findFirstElement, isVisible, sleep, randomJitter, typeHumanLike, clickHumanLike } from '../utils/dom-interactions';

export class GeminiAdapter implements SiteAdapter {
  site = 'gemini' as const;
  private config: SiteSelectorConfig = geminiConfig as SiteSelectorConfig;
  private turndown: TurndownService;

  constructor() {
    this.turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
    });

    // Custom turndown rules for Gemini code blocks & formatted sections
    this.turndown.addRule('fencedCodeBlock', {
      filter: (node) => {
        return node.nodeName === 'PRE' || node.classList?.contains('code-block');
      },
      replacement: (content, node) => {
        const el = node as HTMLElement;
        const codeEl = el.querySelector('code');
        const langClass = codeEl?.className?.match(/language-(\S+)/);
        const lang = langClass ? langClass[1] : '';
        const codeText = codeEl ? codeEl.innerText : el.innerText;
        return `\n\`\`\`${lang}\n${codeText.trim()}\n\`\`\`\n`;
      },
    });
  }

  async isReady(): Promise<{ isReady: boolean; isLoggedIn: boolean; error?: string }> {
    // Check for CAPTCHA
    const captcha = findFirstElement(this.config.selectors.captcha);
    if (captcha && isVisible(captcha)) {
      return {
        isReady: false,
        isLoggedIn: false,
        error: 'CAPTCHA_DETECTED: A Google reCAPTCHA challenge was detected. Please solve it in the tab.',
      };
    }

    // Check for Login wall
    const loginWall = findFirstElement(this.config.selectors.loginWall);
    if (loginWall && isVisible(loginWall)) {
      return {
        isReady: false,
        isLoggedIn: false,
        error: 'LOGIN_REQUIRED: You are currently not signed in to gemini.google.com. Please sign in with your Google account.',
      };
    }

    // Check for Composer
    const composer = findFirstElement(this.config.selectors.composer);
    if (composer && isVisible(composer)) {
      return { isReady: true, isLoggedIn: true };
    }

    // Wait briefly up to 4 seconds for SPA to hydrate
    for (let i = 0; i < 8; i++) {
      await sleep(500);
      const retryComposer = findFirstElement(this.config.selectors.composer);
      if (retryComposer && isVisible(retryComposer)) {
        return { isReady: true, isLoggedIn: true };
      }
    }

    return {
      isReady: false,
      isLoggedIn: false,
      error: 'COMPOSER_NOT_FOUND: Gemini prompt input field was not detected on this page.',
    };
  }

  async newChat(): Promise<void> {
    const newChatBtn = findFirstElement(this.config.selectors.newChatButton);
    if (newChatBtn && isVisible(newChatBtn)) {
      await clickHumanLike(newChatBtn);
      await sleep(randomJitter(500, 1000));
    }
  }

  async sendPrompt(text: string): Promise<void> {
    const composer = findFirstElement(this.config.selectors.composer);
    if (!composer) {
      throw new Error('Could not find Gemini composer input element.');
    }

    // In Gemini's Quill editor, if there's an inner <p>, focus and type into it
    const innerP = composer.querySelector('p');
    const targetElement = innerP || composer;

    // Type text into composer with human-like delays
    await typeHumanLike(targetElement, text);

    await sleep(randomJitter(250, 600));

    // Try finding the send button
    const sendButton = findFirstElement(this.config.selectors.sendButton);
    if (sendButton && !sendButton.hasAttribute('disabled') && isVisible(sendButton)) {
      await clickHumanLike(sendButton);
    } else {
      // Fallback: Dispatch Enter key event
      targetElement.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true,
        })
      );
    }
  }

  async waitForCompletion(timeoutMs = 120000): Promise<{ completed: boolean; error?: string }> {
    const start = Date.now();
    let hasStartedGenerating = false;
    let lastMutationTime = Date.now();

    return new Promise((resolve) => {
      const observer = new MutationObserver(() => {
        lastMutationTime = Date.now();
        const stopBtn = findFirstElement(this.config.selectors.stopButton);
        if (stopBtn && isVisible(stopBtn)) {
          hasStartedGenerating = true;
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      const interval = setInterval(() => {
        const now = Date.now();
        const elapsed = now - start;

        if (elapsed > timeoutMs) {
          clearInterval(interval);
          observer.disconnect();
          resolve({ completed: false, error: `Gemini generation timed out after ${timeoutMs / 1000}s` });
          return;
        }

        const stopBtn = findFirstElement(this.config.selectors.stopButton);
        const isStopVisible = stopBtn && isVisible(stopBtn);

        if (isStopVisible) {
          hasStartedGenerating = true;
        }

        // Generation started and has now quieted down for > 2.5s with no stop button or spinner
        if (hasStartedGenerating && !isStopVisible && now - lastMutationTime > 2500) {
          clearInterval(interval);
          observer.disconnect();
          resolve({ completed: true });
          return;
        }

        // Fallback for fast single-turn answers
        if (elapsed > 8000 && !isStopVisible && now - lastMutationTime > 3000) {
          clearInterval(interval);
          observer.disconnect();
          resolve({ completed: true });
          return;
        }
      }, 500);
    });
  }

  async extractResult(): Promise<{ markdown: string; mediaUrls?: string[] }> {
    const assistantTurns = document.querySelectorAll<HTMLElement>(
      this.config.selectors.assistantMessage.join(', ')
    );

    if (!assistantTurns || assistantTurns.length === 0) {
      throw new Error('No assistant response turns were found in Gemini response DOM.');
    }

    // Latest model turn
    const latestTurn = assistantTurns[assistantTurns.length - 1];

    // Find inner markdown container or use latestTurn
    const markdownContainer =
      latestTurn.querySelector<HTMLElement>('.model-response-text, message-content, .markdown') ||
      latestTurn;

    // Clone element to sanitize
    const clone = markdownContainer.cloneNode(true) as HTMLElement;

    // Remove buttons, tooltips, copy icons, feedback bars
    clone.querySelectorAll('button, [role="button"], mat-icon, .actions-container, .citation-chip').forEach((el) => {
      el.remove();
    });

    const markdown = this.turndown.turndown(clone.innerHTML || clone.innerText);

    return {
      markdown: markdown.trim(),
      mediaUrls: [],
    };
  }
}
