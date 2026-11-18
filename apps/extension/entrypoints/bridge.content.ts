export default defineContentScript({
  matches: [
    'http://localhost:3000/*',
    'http://localhost:3001/*',
    'http://127.0.0.1:3000/*',
    'http://127.0.0.1:3001/*',
  ],
  runAt: 'document_start',
  main() {
    console.log('[SCS Extension] Bridge content script active on web app host');

    const extensionId = chrome.runtime.id;
    const version = chrome.runtime.getManifest().version;

    function broadcastReady() {
      window.postMessage(
        {
          type: 'SCS_EXTENSION_DETECTED',
          extensionId,
          version,
          timestamp: Date.now(),
        },
        '*'
      );
    }

    // Announce presence immediately and after DOM content loaded
    broadcastReady();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', broadcastReady);
    }
    window.addEventListener('load', broadcastReady);

    // Listen to messages from the web dashboard
    window.addEventListener('message', (event) => {
      // Security check: only accept from same origin
      if (event.source !== window) return;

      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'SCS_DISCOVER_EXTENSION') {
        broadcastReady();
      } else if (data.type === 'SCS_BRIDGE_PING') {
        // Forward ping to background script
        chrome.runtime.sendMessage({ type: 'PING', timestamp: data.timestamp || Date.now() }, (response) => {
          window.postMessage(
            {
              type: 'SCS_BRIDGE_PONG',
              requestId: data.requestId,
              response,
              error: chrome.runtime.lastError?.message,
            },
            '*'
          );
        });
      }
    });
  },
});
