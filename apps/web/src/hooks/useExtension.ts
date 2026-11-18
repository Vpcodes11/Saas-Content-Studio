'use client';

import { useState, useEffect, useCallback } from 'react';
import { ExtensionClient, ExtensionPingResult } from '@/lib/extension-client';

export type ExtensionConnectionStatus = 'checking' | 'connected' | 'not_installed' | 'error';

export function useExtension() {
  const [extensionId, setExtensionId] = useState<string>('');
  const [status, setStatus] = useState<ExtensionConnectionStatus>('checking');
  const [version, setVersion] = useState<string | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [lastPingResult, setLastPingResult] = useState<ExtensionPingResult | null>(null);
  const [pingHistory, setPingHistory] = useState<Array<ExtensionPingResult & { timestamp: number }>>([]);
  const [autoDetected, setAutoDetected] = useState(false);

  // Load stored extension ID on initial client mount
  useEffect(() => {
    const stored = ExtensionClient.getStoredExtensionId();
    if (stored) {
      setExtensionId(stored);
    }

    // Listen for extension handshake broadcast from bridge content script
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SCS_EXTENSION_DETECTED' && event.data.extensionId) {
        console.log('[Web App] Extension detected automatically:', event.data);
        setExtensionId(event.data.extensionId);
        setVersion(event.data.version || '0.1.0');
        setAutoDetected(true);
        setStatus('connected');
        ExtensionClient.setStoredExtensionId(event.data.extensionId);
      }
    };

    window.addEventListener('message', handleMessage);

    // Request extension discovery
    window.postMessage({ type: 'SCS_DISCOVER_EXTENSION' }, '*');

    // Also check if stored ID responds directly
    if (stored) {
      ExtensionClient.pingDirect(stored, 1500).then((res) => {
        if (res.success && res.data) {
          setStatus('connected');
          setVersion(res.data.version);
        } else {
          // If direct ping failed, try bridge
          ExtensionClient.pingViaBridge(1500).then((bridgeRes) => {
            if (bridgeRes.success && bridgeRes.data) {
              setStatus('connected');
              setVersion(bridgeRes.data.version);
              setExtensionId(bridgeRes.data.extensionId);
            } else {
              setStatus('not_installed');
            }
          });
        }
      });
    } else {
      // Try bridge discovery
      setTimeout(() => {
        ExtensionClient.pingViaBridge(1500).then((bridgeRes) => {
          if (bridgeRes.success && bridgeRes.data) {
            setStatus('connected');
            setVersion(bridgeRes.data.version);
            setExtensionId(bridgeRes.data.extensionId);
            setAutoDetected(true);
          } else {
            setStatus('not_installed');
          }
        });
      }, 500);
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const sendPing = useCallback(
    async (targetId?: string) => {
      const idToUse = targetId || extensionId;
      setIsPinging(true);

      let result: ExtensionPingResult;

      // Try direct first if we have an ID and window.chrome.runtime.sendMessage
      if (idToUse && typeof window !== 'undefined' && window.chrome?.runtime?.sendMessage) {
        result = await ExtensionClient.pingDirect(idToUse);
      } else {
        // Fallback to bridge
        result = await ExtensionClient.pingViaBridge();
      }

      setIsPinging(false);
      setLastPingResult(result);
      setPingHistory((prev) => [{ ...result, timestamp: Date.now() }, ...prev.slice(0, 19)]);

      if (result.success && result.data) {
        setStatus('connected');
        setVersion(result.data.version);
        if (result.data.extensionId) {
          setExtensionId(result.data.extensionId);
          ExtensionClient.setStoredExtensionId(result.data.extensionId);
        }
      } else {
        if (status === 'connected') {
          setStatus('error');
        }
      }

      return result;
    },
    [extensionId, status]
  );

  const updateExtensionId = (newId: string) => {
    setExtensionId(newId.trim());
    ExtensionClient.setStoredExtensionId(newId.trim());
  };

  return {
    extensionId,
    updateExtensionId,
    status,
    version,
    isPinging,
    lastPingResult,
    pingHistory,
    sendPing,
    autoDetected,
  };
}
