import { defineConfig, createSystem, defaultConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: "#e6f2ff" },
          100: { value: "#cce5ff" },
          200: { value: "#bfdeff" },
          300: { value: "#99caff" },
          400: { value: "#66b3ff" },
          500: { value: "#3399ff" },
          600: { value: "#0080ff" },
          700: { value: "#0066cc" },
          800: { value: "#004d99" },
          900: { value: "#003366" },
          950: { value: "#001a33" },
        },
      },
    },
    semanticTokens: {
      colors: {
        brand: {
          solid: { value: "{colors.brand.500}" },
          contrast: { value: "{colors.brand.100}" },
          fg: { value: "{colors.brand.700}" },
          muted: { value: "{colors.brand.100}" },
          subtle: { value: "{colors.brand.200}" },
          emphasized: { value: "{colors.brand.300}" },
          focusRing: { value: "{colors.brand.500}" },
        },
        bg: {
          value: { base: "white", _dark: "#000000" },
          canvas: { value: { base: "white", _dark: "#000000" } },
          panel: { value: { base: "white", _dark: "#000000" } },
        },
      },
    },
  },
  globalCss: {
    html: {
      bg: { base: "white", _dark: "#000000" },
      minH: "100vh",
    },
    body: {
      bg: { base: "white", _dark: "#000000" },
      minH: "100vh",
    },
    "#root": {
      bg: { base: "white", _dark: "#000000" },
      minH: "100vh",
    },
  },
});

export const system = createSystem(defaultConfig, config);
