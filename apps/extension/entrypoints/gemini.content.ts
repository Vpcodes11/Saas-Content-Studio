import { GeminiAdapter } from '../src/adapters/gemini-adapter';

export default defineContentScript({
  matches: ['https://gemini.google.com/*', 'https://*.gemini.google.com/*'],
  runAt: 'document_idle',
  main() {
    console.log('[SCS Extension] Gemini content script loaded on', window.location.href);

    const adapter = new GeminiAdapter();

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (!message || typeof message !== 'object') return false;

      if (message.type === 'EXECUTE_GEMINI_JOB') {
        const { job } = message;
        console.log('[SCS Gemini Adapter] Starting job execution:', job.id, job.prompt);

        (async () => {
          try {
            // 1. Verify readiness and login status
            const readyCheck = await adapter.isReady();
            if (!readyCheck.isReady) {
              console.warn('[SCS Gemini Adapter] Not ready:', readyCheck.error);
              sendResponse({
                status: 'paused',
                error: readyCheck.error,
                requiresIntervention: true,
              });
              return;
            }

            // 2. Start fresh conversation if needed
            await adapter.newChat();

            // 3. Type and submit prompt
            console.log('[SCS Gemini Adapter] Sending prompt...');
            await adapter.sendPrompt(job.prompt);

            // 4. Wait for generation completion
            console.log('[SCS Gemini Adapter] Waiting for completion...');
            const completion = await adapter.waitForCompletion();
            if (!completion.completed) {
              sendResponse({
                status: 'failed',
                error: completion.error || 'Generation timed out.',
              });
              return;
            }

            // 5. Extract Markdown result via Turndown
            console.log('[SCS Gemini Adapter] Extracting markdown result...');
            const result = await adapter.extractResult();

            console.log('[SCS Gemini Adapter] Job completed successfully!');
            sendResponse({
              status: 'completed',
              resultMarkdown: result.markdown,
              mediaUrls: result.mediaUrls || [],
            });
          } catch (err: any) {
            console.error('[SCS Gemini Adapter] Error during job execution:', err);
            sendResponse({
              status: 'failed',
              error: err.message || 'Unknown error occurred in Gemini tab.',
            });
          }
        })();

        return true; // Keep message channel open for async response
      }

      if (message.type === 'CHECK_GEMINI_READY') {
        adapter.isReady().then(sendResponse);
        return true;
      }

      return false;
    });
  },
});
