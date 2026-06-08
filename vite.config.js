import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { execSync } from "child_process";
import { writeFileSync } from "fs";

function getAppVersion() {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return String(Date.now());
  }
}

const appVersion = getAppVersion();

function versionJsonPlugin() {
  let outDir = "dist";
  return {
    name: "version-json",
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      writeFileSync(
        path.resolve(outDir, "version.json"),
        JSON.stringify({ version: appVersion })
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), versionJsonPlugin()],
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(appVersion),
  },
  resolve: {
    alias: {
      // eslint-disable-next-line no-undef
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          react: ["react", "react-dom", "react-router-dom"],

          // UI (Radix + shadcn + lucide)
          ui: [
            "lucide-react",
            "@radix-ui/react-accordion",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-avatar",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-collapsible",
            "@radix-ui/react-context-menu",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-icons",
            "@radix-ui/react-label",
            "@radix-ui/react-popover",
            "@radix-ui/react-progress",
            "@radix-ui/react-radio-group",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-select",
            "@radix-ui/react-separator",
            "@radix-ui/react-slot",
            "@radix-ui/react-switch",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-toggle",
            "@radix-ui/react-toggle-group",
            "@radix-ui/react-tooltip",
          ],

          // Charts
          charts: ["recharts"],

          // Animations
          animation: ["framer-motion", "swiper", "js-confetti"],

          // File / PDF / Excel tools
          docs: [
            "jspdf",
            "jspdf-autotable",
            "pdf-lib",
            "exceljs",
            "qrcode",
            "@yudiel/react-qr-scanner",
          ],

          // Other utils
          utils: [
            "axios",
            "date-fns",
            "react-day-picker",
            "react-beautiful-dnd",
          ],
        },
      },
    },
    chunkSizeWarningLimit: 2000, // avoid noisy warnings
  },
});
