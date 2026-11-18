export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function randomJitter(minMs: number, maxMs: number): number {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

export function findFirstElement(selectors: string[] = [], root: Document | Element = document): HTMLElement | null {
  for (const selector of selectors) {
    try {
      const el = root.querySelector<HTMLElement>(selector);
      if (el && isVisible(el)) {
        return el;
      }
    } catch (e) {
      // Invalid selector syntax, continue
    }
  }
  return null;
}

export function isVisible(element: HTMLElement): boolean {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
}

/**
 * Types text into a composer like a real human:
 * Realistic typing delays, native input events so React / ProseMirror picks them up.
 */
export async function typeHumanLike(element: HTMLElement, text: string): Promise<void> {
  element.focus();
  await sleep(randomJitter(80, 180));

  const isContentEditable = element.isContentEditable || element.getAttribute('contenteditable') === 'true';

  if (isContentEditable) {
    // Clear existing content
    element.focus();
    document.execCommand('selectAll', false);
    await sleep(randomJitter(30, 60));

    // Try typing with character chunks for realistic flow
    // For long prompts, insert in rapid human phrases with random pauses
    const chunks = text.length > 80 ? text.match(/.{1,8}/g) || [text] : text.split('');

    for (const chunk of chunks) {
      document.execCommand('insertText', false, chunk);
      element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: chunk }));
      await sleep(randomJitter(15, 45));
    }

    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
    // For standard textarea/input, use native property setter to bypass React 16+ overrides
    const nativeSetter = Object.getOwnPropertyDescriptor(
      element instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype,
      'value'
    )?.set;

    element.value = '';
    element.focus();

    // Type in human chunks
    const chunks = text.length > 80 ? text.match(/.{1,8}/g) || [text] : text.split('');
    let accumulated = '';

    for (const chunk of chunks) {
      accumulated += chunk;
      if (nativeSetter) {
        nativeSetter.call(element, accumulated);
      } else {
        element.value = accumulated;
      }
      element.dispatchEvent(new Event('input', { bubbles: true }));
      await sleep(randomJitter(15, 45));
    }

    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  await sleep(randomJitter(150, 300));
}

/**
 * Clicks an element like a real human with mousedown, mouseup, and click sequence.
 */
export async function clickHumanLike(element: HTMLElement): Promise<void> {
  if (!element) return;
  element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  await sleep(randomJitter(60, 140));

  const rect = element.getBoundingClientRect();
  const clientX = rect.left + rect.width / 2;
  const clientY = rect.top + rect.height / 2;

  const eventInit = { bubbles: true, cancelable: true, view: window, clientX, clientY };

  element.dispatchEvent(new MouseEvent('mousedown', eventInit));
  await sleep(randomJitter(40, 90));
  element.dispatchEvent(new MouseEvent('mouseup', eventInit));
  await sleep(randomJitter(20, 50));
  element.click();
}
