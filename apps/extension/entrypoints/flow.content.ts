import { FlowAdapter } from '../src/adapters/flow-adapter';

export default defineContentScript({
  matches: ['https://labs.google/flow*', 'https://*.labs.google/flow*', 'https://aitestkitchen.withgoogle.com/*'],
  runAt: 'document_idle',
  main() {
    console.log('[SCS Extension] Flow content script loaded on', window.location.href);

    const adapter = new FlowAdapter();

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (!message || typeof message !== 'object') return false;

      if (message.type === 'EXECUTE_FLOW_JOB') {
        const { job } = message;
        console.log('[SCS Flow Adapter] Starting video job:', job.id, job.prompt);

        (async () => {
          try {
            // 1. Verify readiness and login status
            const readyCheck = await adapter.isReady();
            if (!readyCheck.isReady) {
              console.warn('[SCS Flow Adapter] Not ready:', readyCheck.error);
              sendResponse({
                status: 'paused',
                error: readyCheck.error,
                requiresIntervention: true,
              });
              return;
            }

            // 2. Start fresh project
            await adapter.newChat();

            // 3. Submit scene prompt
            console.log('[SCS Flow Adapter] Submitting scene prompt...');
            await adapter.sendPrompt(job.prompt);

            // 4. Poll for video rendering completion
            console.log('[SCS Flow Adapter] Polling for video completion...');
            await adapter.waitForCompletion();

            // 5. Extract video clip and poster
            console.log('[SCS Flow Adapter] Extracting generated media...');
            const result = await adapter.extractResult();

            sendResponse({
              status: 'completed',
              resultMarkdown: result.markdown,
              mediaUrls: result.mediaUrls || [],
            });
          } catch (err: any) {
            console.error('[SCS Flow Adapter] Error executing job:', err);
            sendResponse({
              status: 'failed',
              error: err.message || 'Flow video generation encountered an error.',
            });
          }
        })();

        return true;
      }
    });
  },
});
