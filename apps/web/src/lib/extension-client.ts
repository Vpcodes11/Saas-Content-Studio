import { SCS_CONSTANTS, PingMessage, PongMessage, Job, JobResultMessage } from '@scs/shared';

declare global {
  interface Window {
    chrome?: {
      runtime?: {
        sendMessage?: (
          extensionId: string,
          message: any,
          options?: any,
          responseCallback?: (response: any) => void
        ) => void;
        lastError?: { message?: string };
      };
    };
  }
}

export interface ExtensionPingResult {
  success: boolean;
  latencyMs: number;
  data?: PongMessage;
  error?: string;
  method: 'direct' | 'bridge';
}

export interface ExtensionJobResult {
  success: boolean;
  jobId: string;
  status: 'completed' | 'failed' | 'paused';
  resultMarkdown?: string;
  error?: string;
  method: 'direct' | 'bridge';
}

export class ExtensionClient {
  private static extensionIdKey = SCS_CONSTANTS.STORAGE_KEYS.EXTENSION_ID;

  static getStoredExtensionId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.extensionIdKey);
  }

  static setStoredExtensionId(id: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.extensionIdKey, id);
  }

  static async pingDirect(extensionId: string, timeoutMs = 3000): Promise<ExtensionPingResult> {
    const start = performance.now();

    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.chrome?.runtime?.sendMessage) {
        resolve({
          success: false,
          latencyMs: 0,
          error: 'chrome.runtime.sendMessage is not available in this browser window',
          method: 'direct',
        });
        return;
      }

      let answered = false;
      const timer = setTimeout(() => {
        if (!answered) {
          answered = true;
          resolve({
            success: false,
            latencyMs: Math.round(performance.now() - start),
            error: `Ping timed out after ${timeoutMs}ms. Verify extension ID "${extensionId}" is active.`,
            method: 'direct',
          });
        }
      }, timeoutMs);

      try {
        const pingMsg: PingMessage = {
          type: 'PING',
          timestamp: Date.now(),
        };

        window.chrome.runtime.sendMessage(extensionId, pingMsg, (response: any) => {
          if (answered) return;
          clearTimeout(timer);
          answered = true;

          const latencyMs = Math.round(performance.now() - start);
          const lastError = window.chrome?.runtime?.lastError;

          if (lastError) {
            resolve({
              success: false,
              latencyMs,
              error: lastError.message || 'Direct runtime communication error',
              method: 'direct',
            });
          } else if (response && response.type === 'PONG') {
            resolve({
              success: true,
              latencyMs,
              data: response as PongMessage,
              method: 'direct',
            });
          } else {
            resolve({
              success: false,
              latencyMs,
              error: 'Invalid response from extension: ' + JSON.stringify(response),
              method: 'direct',
            });
          }
        });
      } catch (err: any) {
        if (!answered) {
          clearTimeout(timer);
          resolve({
            success: false,
            latencyMs: Math.round(performance.now() - start),
            error: err.message || 'Exception during chrome.runtime.sendMessage',
            method: 'direct',
          });
        }
      }
    });
  }

  static async pingViaBridge(timeoutMs = 3000): Promise<ExtensionPingResult> {
    const start = performance.now();
    const requestId = `ping-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    return new Promise((resolve) => {
      let answered = false;

      const timer = setTimeout(() => {
        if (!answered) {
          answered = true;
          window.removeEventListener('message', listener);
          resolve({
            success: false,
            latencyMs: Math.round(performance.now() - start),
            error: `Bridge ping timed out after ${timeoutMs}ms. Is extension active?`,
            method: 'bridge',
          });
        }
      }, timeoutMs);

      const listener = (event: MessageEvent) => {
        if (event.data?.type === 'SCS_BRIDGE_PONG' && event.data.requestId === requestId) {
          if (answered) return;
          answered = true;
          clearTimeout(timer);
          window.removeEventListener('message', listener);

          const latencyMs = Math.round(performance.now() - start);
          if (event.data.error) {
            resolve({
              success: false,
              latencyMs,
              error: event.data.error,
              method: 'bridge',
            });
          } else if (event.data.response?.type === 'PONG') {
            resolve({
              success: true,
              latencyMs,
              data: event.data.response,
              method: 'bridge',
            });
          } else {
            resolve({
              success: false,
              latencyMs,
              error: 'Unexpected bridge response: ' + JSON.stringify(event.data.response),
              method: 'bridge',
            });
          }
        }
      };

      window.addEventListener('message', listener);
      window.postMessage({ type: 'SCS_BRIDGE_PING', requestId, timestamp: Date.now() }, '*');
    });
  }

  /**
   * Dispatches a job to the extension runner
   */
  static async executeJob(extensionId: string, job: Job, timeoutMs = 180000): Promise<ExtensionJobResult> {
    // Try direct if chrome.runtime.sendMessage is accessible
    if (extensionId && typeof window !== 'undefined' && window.chrome?.runtime?.sendMessage) {
      return new Promise((resolve) => {
        let answered = false;
        const timer = setTimeout(() => {
          if (!answered) {
            answered = true;
            resolve({
              success: false,
              jobId: job.id,
              status: 'failed',
              error: `Job execution timed out after ${timeoutMs / 1000}s.`,
              method: 'direct',
            });
          }
        }, timeoutMs);

        try {
          window.chrome?.runtime?.sendMessage?.(extensionId, { type: 'RUN_JOB', job }, (response: any) => {
            if (answered) return;
            clearTimeout(timer);
            answered = true;

            const lastError = window.chrome?.runtime?.lastError;
            if (lastError) {
              resolve({
                success: false,
                jobId: job.id,
                status: 'failed',
                error: lastError.message || 'Direct runtime error executing job',
                method: 'direct',
              });
            } else if (response && response.type === 'JOB_RESULT') {
              resolve({
                success: response.status === 'completed',
                jobId: job.id,
                status: response.status,
                resultMarkdown: response.resultMarkdown,
                error: response.error,
                method: 'direct',
              });
            } else {
              resolve({
                success: false,
                jobId: job.id,
                status: 'failed',
                error: response?.error || 'Invalid job execution response from extension',
                method: 'direct',
              });
            }
          });
        } catch (err: any) {
          if (!answered) {
            clearTimeout(timer);
            resolve({
              success: false,
              jobId: job.id,
              status: 'failed',
              error: err.message || 'Exception executing job via chrome.runtime',
              method: 'direct',
            });
          }
        }
      });
    }

    // Otherwise, dispatch through bridge
    return new Promise((resolve) => {
      const requestId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      let answered = false;

      const timer = setTimeout(() => {
        if (!answered) {
          answered = true;
          window.removeEventListener('message', listener);
          resolve({
            success: false,
            jobId: job.id,
            status: 'failed',
            error: `Bridge job execution timed out after ${timeoutMs / 1000}s.`,
            method: 'bridge',
          });
        }
      }, timeoutMs);

      const listener = (event: MessageEvent) => {
        if (event.data?.type === 'SCS_BRIDGE_JOB_RESULT' && event.data.requestId === requestId) {
          if (answered) return;
          answered = true;
          clearTimeout(timer);
          window.removeEventListener('message', listener);

          const res = event.data.response;
          if (event.data.error || !res) {
            resolve({
              success: false,
              jobId: job.id,
              status: 'failed',
              error: event.data.error || 'Failed to communicate with extension bridge',
              method: 'bridge',
            });
          } else {
            resolve({
              success: res.status === 'completed',
              jobId: job.id,
              status: res.status,
              resultMarkdown: res.resultMarkdown,
              error: res.error,
              method: 'bridge',
            });
          }
        }
      };

      window.addEventListener('message', listener);
      window.postMessage({ type: 'SCS_BRIDGE_RUN_JOB', job, requestId }, '*');
    });
  }
}
