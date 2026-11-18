import { ChatGPTAdapter } from '../src/adapters/chatgpt-adapter';

export default defineContentScript({
  matches: ['https://chatgpt.com/*', 'https://*.chatgpt.com/*'],
  runAt: 'document_idle',
  main() {
    console.log('[SCS Extension] ChatGPT content script loaded on', window.location.href);

    const adapter = new ChatGPTAdapter();

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (!message || typeof message !== 'object') return false;

      if (message.type === 'EXECUTE_CHATGPT_JOB') {
        const { job } = message;
        console.log('[SCS ChatGPT Adapter] Starting job execution:', job.id, job.prompt);

        (async () => {
          try {
            // 1. Verify page readiness & login
            const readyCheck = await adapter.isReady();
            if (!readyCheck.isReady) {
              console.warn('[SCS ChatGPT Adapter] Not ready:', readyCheck.error);
              sendResponse({
                status: 'paused',
                error: readyCheck.error,
                requiresIntervention: true,
              });
              return;
            }

            // 2. Start fresh conversation if requested or needed
            await adapter.newChat();

            // 3. Type and send prompt
            console.log('[SCS ChatGPT Adapter] Sending prompt...');
            await adapter.sendPrompt(job.prompt);

            // 4. Wait for stream completion
            console.log('[SCS ChatGPT Adapter] Waiting for completion...');
            const completion = await adapter.waitForCompletion();
            if (!completion.completed) {
              sendResponse({
                status: 'failed',
                error: completion.error || 'Generation timed out.',
              });
              return;
            }

            // 5. Extract Markdown result via Turndown
            console.log('[SCS ChatGPT Adapter] Extracting markdown result...');
            const result = await adapter.extractResult();

            console.log('[SCS ChatGPT Adapter] Job completed successfully!');
            sendResponse({
              status: 'completed',
              resultMarkdown: result.markdown,
              mediaUrls: result.mediaUrls || [],
            });
          } catch (err: any) {
            console.error('[SCS ChatGPT Adapter] Error during job execution:', err);
            sendResponse({
              status: 'failed',
              error: err.message || 'Unknown error occurred in ChatGPT tab.',
            });
          }
        })();

        return true; // Keep message channel open for async response
      }

      if (message.type === 'CHECK_CHATGPT_READY') {
        adapter.isReady().then(sendResponse);
        return true;
      }

      return false;
    });
  },
});
