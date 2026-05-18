import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  assetsInclude: ['**/*.mp3', '**/*.wav', '**/*.ogg'],
  build: {
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replaceAll("\\", "/");

          if (!normalizedId.includes("/node_modules/")) {
            return undefined;
          }

          if (
            normalizedId.includes("/node_modules/recharts/")
            || normalizedId.includes("/node_modules/react-google-charts/")
          ) {
            return "charts";
          }

          if (
            normalizedId.includes("/node_modules/docx/")
            || normalizedId.includes("/node_modules/html2canvas/")
            || normalizedId.includes("/node_modules/jspdf/")
          ) {
            return "report-export";
          }

          if (normalizedId.includes("/node_modules/lottie")) {
            return "animation";
          }

          if (
            normalizedId.includes("/node_modules/@radix-ui/")
            || normalizedId.includes("/node_modules/lucide-react/")
            || normalizedId.includes("/node_modules/react-icons/")
          ) {
            return "ui-vendor";
          }

          return undefined;
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  server: {
    headers: {
      'Accept-Ranges': 'bytes',
    },
  },
}))
