import { defineConfig } from 'vite';

// The extension is a static popup: Vite bundles popup.html and its script into dist/,
// and copies public/ (manifest.json) as is. Load dist/ as an unpacked extension.
export default defineConfig({
  // Relative paths, because the extension is served from chrome-extension://<id>/.
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'popup.html',
    },
  },
});
