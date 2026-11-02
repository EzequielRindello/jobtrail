// ESLint configuration shared by the web app (web/) and the browser extension (extension/).
// Run it from the repo root with `npm run lint`. Formatting is Prettier's job, so
// eslint-config-prettier (last in the list) turns off every rule that would fight with it.
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  // Build output, dependencies and the C# API are never linted.
  globalIgnores(['**/node_modules/', '**/dist/', '**/coverage/', 'api/']),

  // Base rules for every JavaScript and TypeScript file.
  js.configs.recommended,
  tseslint.configs.recommended,

  // Web app: React in the browser.
  {
    files: ['web/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: { globals: globals.browser },
  },

  // Browser extension: runs in the browser with access to the chrome.* extension APIs.
  {
    files: ['extension/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.webextensions } },
  },

  // Config files at the root run in Node.
  {
    files: ['*.{js,mjs,cjs,ts}'],
    languageOptions: { globals: globals.node },
  },

  prettier,
]);
