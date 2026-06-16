import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const pagesBase = "/Password-Strength-Checker/";

export default defineConfig({
  base: process.env.GITHUB_PAGES === "true" ? pagesBase : "/",
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
});
