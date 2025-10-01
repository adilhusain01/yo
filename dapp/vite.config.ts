import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Whether to include specific modules or all Node.js modules
      include: ['buffer', 'process', 'util', 'stream', 'crypto'],
      // Whether to polyfill Node.js globals (`global`, `process`, etc.)
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  base: process.env.GH_PAGES ? "/blueproject/" : "./",
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: {
      buffer: "buffer",
    },
  },
  optimizeDeps: {
    include: ["buffer"],
  },
});
