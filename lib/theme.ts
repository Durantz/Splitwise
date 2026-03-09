import { createTheme, rem } from "@mantine/core";

export const theme = createTheme({
  primaryColor: "dark",
  fontFamily: "var(--font-geist, system-ui, sans-serif)",
  defaultRadius: "md",
  colors: {
    // Usiamo "dark" come colore primario per lo stile minimal
    dark: [
      "#f8f8f8", "#e8e8e8", "#d0d0d0", "#a8a8a8",
      "#6e6e6e", "#4a4a4a", "#333333", "#1f1f1f",
      "#141414", "#0a0a0a",
    ],
  },
  components: {
    Button: {
      defaultProps: { radius: "md" },
    },
    Card: {
      defaultProps: { radius: "lg", withBorder: true, shadow: "none" },
    },
    TextInput: {
      defaultProps: { radius: "md" },
    },
    Select: {
      defaultProps: { radius: "md" },
    },
    NumberInput: {
      defaultProps: { radius: "md" },
    },
    Paper: {
      defaultProps: { radius: "lg" },
    },
  },
  headings: {
    fontWeight: "600",
    sizes: {
      h1: { fontSize: rem(24) },
      h2: { fontSize: rem(18) },
      h3: { fontSize: rem(15) },
    },
  },
});
