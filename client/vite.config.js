import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

const apiProxy = (target) => ({
  "/api": {
    target,
    changeOrigin: true,
    secure: false,
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget =
    process.env.VITE_PROXY_TARGET ||
    env.VITE_PROXY_TARGET ||
    "http://localhost:5000";

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    server: {
      host: true,
      port: 5173,
      open: true,
      proxy: apiProxy(proxyTarget),
    },

    preview: {
      host: true,
      port: 4173,
      // Production builds default to same-origin `/api`; this proxy lets
      // `vite preview` exercise that production path locally.
      proxy: apiProxy(proxyTarget),
    },
  };
});