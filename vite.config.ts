import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const BASE = "/sche/";

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "비행 스케줄 Roster",
        short_name: "Roster",
        description: "월간 비행 스케줄을 오늘 한눈에 보는 PWA",
        lang: "ko",
        theme_color: "#0a1f44",
        background_color: "#0a1f44",
        display: "standalone",
        scope: BASE,
        start_url: BASE,
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        navigateFallback: `${BASE}index.html`,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.endsWith("schedule.json"),
            handler: "NetworkFirst",
            options: {
              cacheName: "schedule-data",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 24 * 31 }
            }
          }
        ]
      }
    })
  ]
});
