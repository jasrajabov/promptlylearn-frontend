import { defineConfig, createSystem, defaultConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    tokens: {
      colors: {},
    },
  },
  globalCss: {
    "html, body": {
      margin: 0,
      padding: 0,
      overflowX: "hidden",
    },
  },
});

export const system = createSystem(defaultConfig, config);
