// Vite multi-page config. Pages live under src/<page>/index.html so the
// deployed URLs are /studio/, /upload/, /spectator/, /watch/, /approve/, /metrics/.
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const here = import.meta.dirname;
const root = resolve(here, 'src');
const pages = ['studio', 'upload', 'spectator', 'watch', 'approve', 'metrics'];

export default defineConfig({
  root,
  publicDir: resolve(here, 'public'),
  envDir: here, // .env lives in the repo root, not in src/
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
  build: {
    outDir: resolve(here, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(root, 'index.html'),
        ...Object.fromEntries(pages.map((p) => [p, resolve(root, p, 'index.html')])),
      },
    },
  },
  // TODO(M2): copy @ricky0123/vad-web + onnxruntime-web assets (worklet, .onnx, .wasm)
  // into the build with vite-plugin-static-copy.
  test: {
    root: here,
    include: ['tests/**/*.test.js'],
  },
});
