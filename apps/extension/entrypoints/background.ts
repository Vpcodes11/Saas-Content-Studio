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

function addLog(type: LogItem['type'], message: string, details?: any) {
  const log: LogItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    type,
    message,
    details,
  };
  eventLogs.unshift(log);
  if (eventLogs.length > 100) {
    eventLogs.pop();
  }
  // Broadcast to extension views (e.g. side panel)
  chrome.runtime.sendMessage({ type: 'SCS_INTERNAL_EVENT_LOG', log }).catch(() => {
    // No views open, ignore
  });
}

export default defineBackground(() => {
  addLog('system', 'Service worker initialized');

  // Configure sidepanel to open on clicking action button
  chrome.sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: true }).catch((err) => {
    console.warn('Failed to set sidePanel behavior:', err);
  });

  // Handle external messages from the Web dashboard (localhost / production domain)
  chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    console.log('[SCS Background] External message received from:', sender.url, message);

    if (!message || typeof message !== 'object') {
      sendResponse({ type: 'ERROR', error: 'Invalid message payload' });
      return false;
    }

    switch (message.type) {
      case 'PING': {
        const pingTime = Date.now();
        addLog('ping', `Ping received from ${sender.url || 'external web'}`, {
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
        addLog('user', 'Queue paused via external command (Manual takeover mode)');
        sendResponse({ status: 'paused', isPaused: true });
        return false;
      }

      case 'RESUME_QUEUE': {
        isPaused = false;
        addLog('user', 'Queue resumed via external command');
        sendResponse({ status: 'resumed', isPaused: false });
        return false;
      }

      default: {
        addLog('system', `Unknown external message type: ${message.type}`);
        sendResponse({ type: 'ERROR', error: `Unknown message type: ${message.type}` });
        return false;
      }
    }
  });

  // Handle internal messages (e.g. from Sidepanel or Content Scripts)
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
        addLog('user', `Takeover toggled: ${isPaused ? 'PAUSED (Manual takeover)' : 'RESUMED'}`);
        sendResponse({ isPaused });
        return false;
      }

      case 'CLEAR_LOGS': {
        eventLogs.length = 0;
        sendResponse({ ok: true });
        return false;
      }

      default:
        return false;
    }
  });
});
