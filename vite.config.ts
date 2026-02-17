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
        manualChunks(id) {
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/"))
            return "vendor-react";
          if (id.includes("node_modules/@chakra-ui/") || id.includes("node_modules/@ark-ui/"))
            return "vendor-chakra";
          if (
            id.includes("node_modules/react-markdown") ||
            id.includes("node_modules/remark-") ||
            id.includes("node_modules/rehype-") ||
            id.includes("node_modules/unified") ||
            id.includes("node_modules/mdast-") ||
            id.includes("node_modules/hast-") ||
            id.includes("node_modules/micromark")
          )
            return "vendor-markdown";
          if (
            id.includes("node_modules/react-syntax-highlighter") ||
            id.includes("node_modules/refractor") ||
            id.includes("node_modules/prismjs")
          )
            return "vendor-syntax-highlight";
          if (id.includes("node_modules/katex"))
            return "vendor-katex";
          if (
            id.includes("node_modules/reactflow") ||
            id.includes("node_modules/@reactflow/") ||
            id.includes("node_modules/dagre")
          )
            return "vendor-reactflow";
          if (id.includes("node_modules/framer-motion"))
            return "vendor-framer";
        },
      },
      external: ["/manifest.json"],
    },
  },
});
