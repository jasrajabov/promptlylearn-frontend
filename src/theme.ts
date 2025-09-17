// theme.ts
import { defineConfig, createSystem, defaultConfig } from "@chakra-ui/react";

const themeSystem = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: { value: "#3498db" },
      },
      fonts: {
        heading: { value: "'Roboto', sans-serif" },
        body: { value: "'Roboto', sans-serif" },
      },
      fontSizes: {
        md: { value: "16px" },
        lg: { value: "20px" },
      },
    },
    semanticTokens: {
      colors: {
        background: {
          default: { value: "#f4f4f4" }, // light mode
          _dark: { value: "#1a202c" }, // dark mode
        },
        text: {
          default: { value: "#2c3e50" }, // light mode
          _dark: { value: "#e2e8f0" }, // dark mode
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, themeSystem);
