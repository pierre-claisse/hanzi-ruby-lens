import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

// `BASE` is provided by the GitHub Actions deploy workflow so the bundle
// can be hosted under `https://pierre-claisse.github.io/hanzi-ruby-lens/`.
// Locally it defaults to "/" so `npm run dev` works as before.
const base = process.env.VITE_BASE ?? "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      workbox: {
        // Take control as soon as a new SW is activated — Pierre wants
        // updates pushed without user interaction.
        skipWaiting: true,
        clientsClaim: true,
        // Precache the bundle (JS/CSS/HTML/etc.) but NOT the giant Chinese
        // fonts and the jieba WASM (~4 MB) — those are runtime-cached on
        // first use to keep the initial install reasonable.
        globPatterns: ["**/*.{js,css,html,bin,json,svg,png,ico}"],
        navigateFallback: "index.html",
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === "https://api.github.com",
            handler: "NetworkOnly",
          },
          {
            // Fonts (multi-MB Chinese) — cache aggressively after first
            // fetch so subsequent visits are instant.
            urlPattern: ({ request }) => request.destination === "font",
            handler: "CacheFirst",
            options: {
              cacheName: "fonts",
              expiration: {
                maxEntries: 64,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            // jieba WASM (~4 MB) — only fetched on first text creation;
            // cached forever after, since the URL is content-hashed.
            urlPattern: ({ url }) => url.pathname.endsWith(".wasm"),
            handler: "CacheFirst",
            options: {
              cacheName: "wasm",
              expiration: {
                maxEntries: 8,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
      manifest: {
        name: "Hanzi Ruby Lens",
        short_name: "HRL",
        description:
          "Chinese reader with pinyin ruby annotations, comments and shared sessions.",
        theme_color: "#7E1F4F",
        background_color: "#FAF5EF",
        display: "standalone",
        start_url: ".",
        scope: ".",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // Tauri compatibility shims — let every existing
      // `import ... from "@tauri-apps/api/core"` etc. resolve to a TS shim
      // that dispatches to the in-browser modules. Removed in Phase 8 along
      // with all `invoke()` call sites.
      "@tauri-apps/api/core": fileURLToPath(
        new URL("./src/tauriShim/core.ts", import.meta.url),
      ),
      "@tauri-apps/api/window": fileURLToPath(
        new URL("./src/tauriShim/window.ts", import.meta.url),
      ),
      "@tauri-apps/plugin-dialog": fileURLToPath(
        new URL("./src/tauriShim/dialog.ts", import.meta.url),
      ),
      "@tauri-apps/plugin-clipboard-manager": fileURLToPath(
        new URL("./src/tauriShim/clipboard.ts", import.meta.url),
      ),
      "@tauri-apps/plugin-opener": fileURLToPath(
        new URL("./src/tauriShim/opener.ts", import.meta.url),
      ),
    },
  },
  clearScreen: false,
  server: {
    strictPort: true,
  },
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    target: "chrome105",
    minify: !process.env.TAURI_DEBUG ? "oxc" : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
});
