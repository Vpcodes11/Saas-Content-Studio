interface LogItem {
  id: string;
  timestamp: number;
  type: 'ping' | 'status' | 'job' | 'system' | 'user';
  message: string;
  details?: any;
}

let isPaused = false;
let activeJob: any = null;
const jobQueue: any[] = [];
const eventLogs: LogItem[] = [];

// Rate limiting: max 20 jobs per hour per site by default
const jobTimestamps: Record<string, number[]> = {
  chatgpt: [],
  gemini: [],
  flow: [],
};
const MAX_JOBS_PER_HOUR = 20;

function checkRateLimit(site: string): boolean {
  const now = Date.now();
  const oneHourAgo = now - 3600000;
  const history = (jobTimestamps[site] || []).filter((t) => t > oneHourAgo);
  jobTimestamps[site] = history;
  return history.length < MAX_JOBS_PER_HOUR;
}

function recordJobExecution(site: string) {
  if (!jobTimestamps[site]) jobTimestamps[site] = [];
  jobTimestamps[site].push(Date.now());
}

function addLog(type: LogItem['type'], message: string, details?: any) {
  const log: LogItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    type,
    message,
    details,
  };
  eventLogs.unshift(log);
  if (eventLogs.length > 150) {
    eventLogs.pop();
  }
  chrome.runtime.sendMessage({ type: 'SCS_INTERNAL_EVENT_LOG', log }).catch(() => {});
}

async function getOrCreateTabForSite(site: string): Promise<chrome.tabs.Tab> {
  const siteUrls: Record<string, { url: string; match: string[] }> = {
    chatgpt: {
      url: 'https://chatgpt.com',
      match: ['https://chatgpt.com/*', 'https://*.chatgpt.com/*'],
    },
    gemini: {
      url: 'https://gemini.google.com/app',
      match: ['https://gemini.google.com/*'],
    },
    flow: {
      url: 'https://labs.google/flow',
      match: ['https://labs.google/flow*'],
    },
  };

  const config = siteUrls[site] || { url: 'https://chatgpt.com', match: ['https://chatgpt.com/*'] };

  const tabs = await chrome.tabs.query({ url: config.match });
  if (tabs.length > 0 && tabs[0].id) {
    // Focus existing visible tab so the user can watch execution
    await chrome.tabs.update(tabs[0].id, { active: true });
    if (tabs[0].windowId) {
      await chrome.windows.update(tabs[0].windowId, { focused: true });
    }
    return tabs[0];
  }

  // Open fresh visible tab (never hidden / headless)
  const newTab = await chrome.tabs.create({ url: config.url, active: true });

  // Wait for tab to load completely
  await new Promise<void>((resolve) => {
    const listener = (tabId: number, info: chrome.tabs.TabChangeInfo) => {
      if (tabId === newTab.id && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
    setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    }, 12000);
  });

  return newTab;
}

export default defineBackground(() => {
  addLog('system', 'Service worker initialized & listening');

  chrome.sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: true }).catch((err) => {
    console.warn('Failed to set sidePanel behavior:', err);
  });

  // Handle external messages from Web dashboard
  chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    console.log('[SCS Background] External message from:', sender.url, message);

    if (!message || typeof message !== 'object') {
      sendResponse({ type: 'ERROR', error: 'Invalid message payload' });
      return false;
    }

    switch (message.type) {
      case 'PING': {
        const pingTime = Date.now();
        addLog('ping', `Ping from ${sender.url || 'web app'}`, {
          clientTimestamp: message.timestamp,
        });

        sendResponse({
          type: 'PONG',
          timestamp: pingTime,
          extensionId: chrome.runtime.id,
          version: chrome.runtime.getManifest().version,
          status: isPaused ? 'paused' : activeJob ? 'busy' : 'idle',
          supportedSites: ['chatgpt', 'gemini', 'flow'],
          activeJobsCount: activeJob ? 1 : 0,
        });
        return false;
      }

      case 'RUN_JOB': {
        const { job } = message;
        if (!job || !job.prompt) {
          sendResponse({ type: 'ERROR', error: 'Job payload missing prompt.' });
          return false;
        }

        // Safety rule: check if takeover mode is active
        if (isPaused) {
          sendResponse({
            type: 'JOB_RESULT',
            jobId: job.id,
            status: 'paused',
            error: 'Manual takeover mode is active. Resume the queue in the extension side panel.',
          });
          return false;
        }

        // Rate limiting check
        if (!checkRateLimit(job.targetSite || 'chatgpt')) {
          sendResponse({
            type: 'JOB_RESULT',
            jobId: job.id,
            status: 'failed',
            error: `Rate limit reached for ${job.targetSite} (max ${MAX_JOBS_PER_HOUR} jobs/hour to protect your account).`,
          });
          return false;
        }

        // Single active job at a time rule
        if (activeJob) {
          sendResponse({
            type: 'JOB_RESULT',
            jobId: job.id,
            status: 'failed',
            error: 'Another job is currently running. Please wait for it to finish.',
          });
          return false;
        }

        activeJob = job;
        addLog('job', `Starting ${job.targetSite} job: "${job.prompt.slice(0, 40)}..."`, { jobId: job.id });

        (async () => {
          try {
            // Find or open visible tab for target site
            const tab = await getOrCreateTabForSite(job.targetSite);
            if (!tab || !tab.id) {
              throw new Error(`Failed to locate or open tab for ${job.targetSite}`);
            }

            // Small delay to ensure content script is injected
            await new Promise((r) => setTimeout(r, 1200));

            // Execute job through content script
            const actionType =
              job.targetSite === 'chatgpt'
                ? 'EXECUTE_CHATGPT_JOB'
                : job.targetSite === 'gemini'
                ? 'EXECUTE_GEMINI_JOB'
                : 'EXECUTE_FLOW_JOB';

            chrome.tabs.sendMessage(tab.id, { type: actionType, job }, async (response) => {
              const lastErr = chrome.runtime.lastError;
              activeJob = null;

              if (lastErr) {
                addLog('job', `Content script communication error: ${lastErr.message}`);
                sendResponse({
                  type: 'JOB_RESULT',
                  jobId: job.id,
                  status: 'failed',
                  error: `Could not reach ${job.targetSite} page content script: ${lastErr.message}. Make sure the tab is open and refreshed.`,
                });
                return;
              }

              if (response?.status === 'completed') {
                recordJobExecution(job.targetSite);
                addLog('job', `Job completed (${response.resultMarkdown?.length || 0} chars)`, { jobId: job.id });
                sendResponse({
                  type: 'JOB_RESULT',
                  jobId: job.id,
                  status: 'completed',
                  resultMarkdown: response.resultMarkdown,
                  mediaUrls: response.mediaUrls || [],
                });
              } else if (response?.requiresIntervention || response?.status === 'paused') {
                isPaused = true;
                addLog('user', `Intervention required: ${response.error || 'Login or CAPTCHA detected'}`);
                sendResponse({
                  type: 'JOB_RESULT',
                  jobId: job.id,
                  status: 'paused',
                  error: response.error || 'Manual intervention required in tab.',
                });
              } else {
                addLog('job', `Job failed: ${response?.error || 'Unknown error'}`);
                sendResponse({
                  type: 'JOB_RESULT',
                  jobId: job.id,
                  status: 'failed',
                  error: response?.error || 'Job execution failed in browser session.',
                });
              }
            });
          } catch (err: any) {
            activeJob = null;
            addLog('job', `Job initialization exception: ${err.message}`);
            sendResponse({
              type: 'JOB_RESULT',
              jobId: job.id,
              status: 'failed',
              error: err.message || 'Error initializing job in browser.',
            });
          }
        })();

        return true; // Keep channel open for async response
      }

      case 'GET_STATUS': {
        sendResponse({
          type: 'STATUS_RESPONSE',
          status: isPaused ? 'paused' : activeJob ? 'busy' : 'idle',
          isPaused,
          activeJob,
          queueLength: jobQueue.length,
          extensionId: chrome.runtime.id,
          version: chrome.runtime.getManifest().version,
        });
        return false;
      }

      case 'PAUSE_QUEUE': {
        isPaused = true;
        addLog('user', 'Queue paused (Manual Takeover Active)');
        sendResponse({ status: 'paused', isPaused: true });
        return false;
      }

      case 'RESUME_QUEUE': {
        isPaused = false;
        addLog('user', 'Queue resumed');
        sendResponse({ status: 'resumed', isPaused: false });
        return false;
      }

      default: {
        sendResponse({ type: 'ERROR', error: `Unknown message type: ${message.type}` });
        return false;
      }
    }
  });

  // Handle internal messages (Sidepanel & Bridge)
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || typeof message !== 'object') return false;

    switch (message.type) {
      case 'GET_INTERNAL_STATE': {
        sendResponse({
          isPaused,
          activeJob,
          queueLength: jobQueue.length,
          logs: eventLogs,
          extensionId: chrome.runtime.id,
          version: chrome.runtime.getManifest().version,
        });
        return false;
      }

      case 'TOGGLE_PAUSE': {
        isPaused = !isPaused;
        addLog('user', `Takeover toggled: ${isPaused ? 'PAUSED' : 'RESUMED'}`);
        sendResponse({ isPaused });
        return false;
      }

      case 'CLEAR_LOGS': {
        eventLogs.length = 0;
        sendResponse({ ok: true });
        return false;
      }

      case 'FORWARD_TO_EXTERNAL': {
        // Forward from bridge content script to external runner logic
        chrome.runtime.onMessageExternal.dispatch(
          message.payload,
          { id: chrome.runtime.id, url: sender.url || 'bridge' },
          sendResponse
        );
        return true;
      }

      default:
        return false;
    }
  });
});
