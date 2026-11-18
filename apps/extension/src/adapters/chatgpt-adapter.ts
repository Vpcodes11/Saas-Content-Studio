import TurndownService from 'turndown';
import { SiteAdapter, SiteSelectorConfig } from '@scs/shared';
import chatgptConfig from './selectors/chatgpt.json';
import { findFirstElement, isVisible, sleep, randomJitter, typeHumanLike, clickHumanLike } from '../utils/dom-interactions';

export class ChatGPTAdapter implements SiteAdapter {
  site = 'chatgpt' as const;
  private config: SiteSelectorConfig = chatgptConfig as SiteSelectorConfig;
  private turndown: TurndownService;

  constructor() {
    this.turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
    });

    // Custom turndown rules for ChatGPT codeblocks
    this.turndown.addRule('fencedCodeBlock', {
      filter: (node) => {
        return node.nodeName === 'PRE';
      },
      replacement: (content, node) => {
        const el = node as HTMLElement;
        const codeEl = el.querySelector('code');
        const langClass = codeEl?.className.match(/language-(\S+)/);
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
        error: 'CAPTCHA_DETECTED: A Cloudflare or Arkose verification gate is visible. Please solve it in the tab.',
      };
    }

    // Check for Login wall
    const loginWall = findFirstElement(this.config.selectors.loginWall);
    if (loginWall && isVisible(loginWall)) {
      return {
        isReady: false,
        isLoggedIn: false,
        error: 'LOGIN_REQUIRED: You are currently logged out of chatgpt.com. Please log into your account.',
      };
    }

    // Check for Composer
    const composer = findFirstElement(this.config.selectors.composer);
    if (composer && isVisible(composer)) {
      return { isReady: true, isLoggedIn: true };
    }

    // Wait briefly up to 3 seconds for SPA to hydrate
    for (let i = 0; i < 6; i++) {
      await sleep(500);
      const retryComposer = findFirstElement(this.config.selectors.composer);
      if (retryComposer && isVisible(retryComposer)) {
        return { isReady: true, isLoggedIn: true };
      }
    }

    return {
      isReady: false,
      isLoggedIn: false,
      error: 'COMPOSER_NOT_FOUND: ChatGPT composer textarea was not detected on this page.',
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
      throw new Error('Could not find ChatGPT composer input element.');
    }

    // Type text into composer with human-like keystroke delays and native React events
    await typeHumanLike(composer, text);

    await sleep(randomJitter(200, 500));

    // Find and click the send button
    const sendButton = findFirstElement(this.config.selectors.sendButton);
    if (sendButton && !sendButton.hasAttribute('disabled')) {
      await clickHumanLike(sendButton);
    } else {
      // Fallback: press Enter key in composer
      composer.dispatchEvent(
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
      // 1. Observe mutations in conversation container or body
      const observer = new MutationObserver(() => {
        lastMutationTime = Date.now();
        // Check if stop button is present, which signifies active generation
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

      // 2. Polling interval to check for quiet period + absence of stop button
      const interval = setInterval(() => {
        const now = Date.now();
        const elapsed = now - start;

        // Check if timed out
        if (elapsed > timeoutMs) {
          clearInterval(interval);
          observer.disconnect();
          resolve({ completed: false, error: `ChatGPT generation timed out after ${timeoutMs / 1000}s` });
          return;
        }

        const stopBtn = findFirstElement(this.config.selectors.stopButton);
        const isStopVisible = stopBtn && isVisible(stopBtn);

        if (isStopVisible) {
          hasStartedGenerating = true;
        }

        // Generation has started and now has gone quiet for > 2.5 seconds with no stop button visible
        if (hasStartedGenerating && !isStopVisible && now - lastMutationTime > 2500) {
          clearInterval(interval);
          observer.disconnect();
          resolve({ completed: true });
          return;
        }

        // Fallback: if 10 seconds have elapsed with no stop button and no mutations for > 3.5s
        if (elapsed > 10000 && !isStopVisible && now - lastMutationTime > 3500) {
          clearInterval(interval);
          observer.disconnect();
          resolve({ completed: true });
          return;
        }
      }, 500);
    });
  }

  async extractResult(): Promise<{ markdown: string; mediaUrls?: string[] }> {
    // Find assistant messages
    const assistantTurns = document.querySelectorAll<HTMLElement>(
      this.config.selectors.assistantMessage.join(', ')
    );

    if (!assistantTurns || assistantTurns.length === 0) {
      throw new Error('No assistant message turns were found in ChatGPT response DOM.');
    }

    // Target the latest response turn
    const latestTurn = assistantTurns[assistantTurns.length - 1];

    // Try finding the inner markdown container
    const markdownContainer =
      latestTurn.querySelector<HTMLElement>('.markdown, .prose') || latestTurn;

    // Clone element to sanitize before markdown extraction
    const clone = markdownContainer.cloneNode(true) as HTMLElement;

    // Remove buttons, tooltips, action bars
    clone.querySelectorAll('button, [role="button"], .sr-only, svg').forEach((el) => {
      // Preserve SVG only if needed, otherwise drop decorative elements
      el.remove();
    });

    const markdown = this.turndown.turndown(clone.innerHTML || clone.innerText);

    return {
      markdown: markdown.trim(),
      mediaUrls: [],
    };
  }
}
