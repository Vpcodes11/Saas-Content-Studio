import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'SaaS Content Studio Runner',
    description: 'Human-like browser automation runner for SaaS Content Studio',
    version: '0.1.0',
    permissions: [
      'tabs',
      'activeTab',
      'storage',
      'sidePanel',
      'scripting',
    ],
    host_permissions: [
      'https://chatgpt.com/*',
      'https://*.chatgpt.com/*',
      'https://gemini.google.com/*',
      'https://labs.google/*',
      'http://localhost:3000/*',
      'http://localhost:3001/*',
      'http://127.0.0.1:3000/*',
      'http://127.0.0.1:3001/*',
    ],
    externally_connectable: {
      matches: [
        'http://localhost:3000/*',
        'http://localhost:3001/*',
        'http://127.0.0.1:3000/*',
        'http://127.0.0.1:3001/*',
      ],
    },
    action: {
      default_title: 'SaaS Content Studio',
    },
  },
});
