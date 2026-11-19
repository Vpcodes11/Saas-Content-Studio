/**
 * AI Locator Fallback & Selector Health Checker
 * If a stable DOM selector fails (due to minor HTML updates on ChatGPT, Gemini, or Flow),
 * this fallback extracts a compact accessibility-tree/semantic snapshot of the active page
 * and uses semantic heuristic matching to locate the correct interactive element.
 * It also records when the fallback was used so the config can be updated.
 */

export interface SemanticNode {
  tag: string;
  role?: string;
  text?: string;
  ariaLabel?: string;
  placeholder?: string;
  testId?: string;
  element: HTMLElement;
}

export function extractCompactA11ySnapshot(root: Document | HTMLElement = document): SemanticNode[] {
  const interactiveSelectors = [
    'button',
    'textarea',
    'input',
    'div[contenteditable="true"]',
    'div[role="button"]',
    'div[role="textbox"]',
    'a[role="button"]',
    '[data-testid]',
    '[aria-label]',
  ];

  const elements = Array.from(root.querySelectorAll(interactiveSelectors.join(','))) as HTMLElement[];
  const snapshot: SemanticNode[] = [];

  for (const el of elements) {
    // Only inspect elements that are in DOM and rendered
    if (el.offsetParent === null && el.offsetWidth === 0 && el.offsetHeight === 0) continue;

    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute('role') || undefined;
    const ariaLabel = el.getAttribute('aria-label') || undefined;
    const placeholder = el.getAttribute('placeholder') || undefined;
    const testId = el.getAttribute('data-testid') || undefined;
    const rawText = el.innerText ? el.innerText.trim().slice(0, 80) : undefined;

    snapshot.push({
      tag,
      role,
      ariaLabel,
      placeholder,
      testId,
      text: rawText,
      element: el,
    });
  }

  return snapshot;
}

/**
 * Locate element using primary selector with automated AI-locator semantic fallback
 */
export function locateElementWithFallback(
  primarySelector: string,
  purpose: 'composer' | 'send' | 'new_chat' | 'generate' | 'video' | 'download',
  site: 'chatgpt' | 'gemini' | 'flow'
): HTMLElement | null {
  // 1. Try primary selectors from config
  const selectors = primarySelector.split(',').map((s) => s.trim());
  for (const sel of selectors) {
    try {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (el) return el;
    } catch {}
  }

  // 2. Fallback to Semantic A11y Tree Matching
  const snapshot = extractCompactA11ySnapshot();
  let matched: HTMLElement | null = null;

  if (purpose === 'composer') {
    // Find editable container or textarea
    const candidate = snapshot.find(
      (n) =>
        (n.tag === 'textarea' || n.element.getAttribute('contenteditable') === 'true') &&
        (!n.placeholder || /message|prompt|ask|chat|describe/i.test(n.placeholder))
    ) || snapshot.find((n) => n.element.getAttribute('contenteditable') === 'true');

    if (candidate) matched = candidate.element;
  } else if (purpose === 'send' || purpose === 'generate') {
    // Find submit / send / generate button
    const candidate = snapshot.find(
      (n) =>
        (n.tag === 'button' || n.role === 'button') &&
        ((n.ariaLabel && /send|generate|submit|run/i.test(n.ariaLabel)) ||
          (n.text && /send|generate|submit|create/i.test(n.text)) ||
          (n.testId && /send|generate/i.test(n.testId)))
    );

    if (candidate) matched = candidate.element;
  } else if (purpose === 'new_chat') {
    // Find new chat or new project button
    const candidate = snapshot.find(
      (n) =>
        (n.tag === 'button' || n.role === 'button' || n.tag === 'a') &&
        ((n.ariaLabel && /new chat|new project|create/i.test(n.ariaLabel)) ||
          (n.text && /new chat|new project|\+ new/i.test(n.text)))
    );

    if (candidate) matched = candidate.element;
  }

  if (matched) {
    console.warn(
      `[SCS AI-Locator Fallback] Primary selector "${primarySelector}" failed on ${site}. Fallback successfully located element:`,
      matched
    );

    // Notify extension background / logs
    try {
      chrome.runtime.sendMessage({
        type: 'SCS_INTERNAL_EVENT_LOG',
        log: {
          id: `fallback-${Date.now()}`,
          timestamp: Date.now(),
          type: 'system',
          message: `AI-Locator Fallback activated for ${site} (${purpose}). Located via semantic tree.`,
        },
      });
    } catch {}

    return matched;
  }

  return null;
}

/**
 * Health check on current site DOM
 */
export function checkSiteSelectorHealth(site: 'chatgpt' | 'gemini' | 'flow'): {
  site: string;
  healthy: boolean;
  score: number;
  checks: Record<string, boolean>;
} {
  const checks: Record<string, boolean> = {};

  if (site === 'chatgpt') {
    checks.composer = !!locateElementWithFallback('#prompt-textarea', 'composer', 'chatgpt');
    checks.sendButton = !!locateElementWithFallback('button[data-testid="send-button"]', 'send', 'chatgpt');
    checks.newChat = !!locateElementWithFallback('a[href="/"]', 'new_chat', 'chatgpt');
  } else if (site === 'gemini') {
    checks.composer = !!locateElementWithFallback('div.ql-editor[contenteditable="true"]', 'composer', 'gemini');
    checks.sendButton = !!locateElementWithFallback('button[aria-label*="Send"]', 'send', 'gemini');
    checks.newChat = !!locateElementWithFallback('button[aria-label*="New chat"]', 'new_chat', 'gemini');
  } else if (site === 'flow') {
    checks.composer = !!locateElementWithFallback('textarea[placeholder*="Describe"]', 'composer', 'flow');
    checks.generateBtn = !!locateElementWithFallback('button:has-text("Generate")', 'generate', 'flow');
    checks.newProject = !!locateElementWithFallback('button:has-text("New project")', 'new_chat', 'flow');
  }

  const values = Object.values(checks);
  const passed = values.filter(Boolean).length;
  const score = Math.round((passed / values.length) * 100);

  return {
    site,
    healthy: score >= 66,
    score,
    checks,
  };
}
