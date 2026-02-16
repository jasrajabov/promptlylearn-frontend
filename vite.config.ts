import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,
      filename: "dist/stats.html",
      gzipSize: true,
      brotliSize: true,
      template: "treemap",
    }),
  ],
  publicDir: "public",

  // Define build-time constants
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },

  // Resolve configuration to prevent duplicate React
  resolve: {
    alias: {
      react: path.resolve("./node_modules/react"),
      "react-dom": path.resolve("./node_modules/react-dom"),
    },
    dedupe: ["react", "react-dom"],
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ["react", "react-dom"],
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
      external: ["/manifest.json"],
    },
  },
});
