export const SCS_CONSTANTS = {
  EXTENSION_NAME: 'SaaS Content Studio Runner',
  EXTENSION_VERSION: '0.1.0',
  DEFAULT_MAX_JOBS_PER_HOUR: 20,
  SUPPORTED_SITES: ['chatgpt', 'gemini', 'flow'] as const,
  SITE_URLS: {
    chatgpt: 'https://chatgpt.com',
    gemini: 'https://gemini.google.com/app',
    flow: 'https://labs.google/flow',
    claude: 'https://claude.ai',
  },
  DEFAULT_PING_TIMEOUT_MS: 3000,
  DEFAULT_JOB_TIMEOUT_MS: 180000, // 3 minutes
  STORAGE_KEYS: {
    EXTENSION_ID: 'scs_extension_id',
    AUTO_DETECTED_ID: 'scs_auto_detected_id',
    LAST_PING_TIME: 'scs_last_ping_time',
  },
} as const;
