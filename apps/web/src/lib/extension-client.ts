import { SCS_CONSTANTS, PingMessage, PongMessage, StatusResponseMessage } from '@scs/shared';

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

  /**
   * Ping extension via direct chrome.runtime.sendMessage
   */
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
            error: `Ping timed out after ${timeoutMs}ms. Verify extension ID "${extensionId}" is loaded and active.`,
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

  /**
   * Ping extension via DOM content-script bridge
   */
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
            error: `Bridge ping timed out after ${timeoutMs}ms. Is the extension installed & active on this tab?`,
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
      window.postMessage(
        {
          type: 'SCS_BRIDGE_PING',
          requestId,
          timestamp: Date.now(),
        },
        '*'
      );
    });
  }
}
