import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  envPrefix: ["VITE_", "APP_"],
  server: {
    host: "::",
    port: 8080,
  },
  base: "/",
  build: {
    // Target ES2018 + Chrome 61 for wide Android WebView compatibility
    target: ["es2018", "chrome61"],
    cssTarget: "chrome61",
    // Split chunks to prevent giant 1.3MB bundle causing OOM on Android WebView
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // Animation library (heavy, isolate for caching)
          "vendor-motion": ["framer-motion"],
          // Map library (heavy, isolate for caching)
          "vendor-map": ["leaflet"],
          // UI & state libraries
          "vendor-ui": [
            "@tanstack/react-query",
            "@radix-ui/react-dialog",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-select",
            "@radix-ui/react-slider",
            "lucide-react",
          ],
          // Supabase client
          "vendor-supabase": ["@supabase/supabase-js"],
        },
      },
    },
    // Increase chunk size warning limit (map tiles bundles are naturally large)
    chunkSizeWarningLimit: 1000,
    // Don't inline small assets – keep them as separate cached files
    assetsInlineLimit: 0,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    css: true,
    restoreMocks: true,
    clearMocks: true,
    mockReset: true,
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest}.config.*",
      "e2e/**"
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html", "lcov", "json-summary"],
      reportsDirectory: "./coverage",
      all: true,
      // Fokus coverage ke "production-critical modules":
      // - pure logic + integration boundaries (lib/, data/)
      // - notification toggle (stateful prod behavior)
      // - popup (core UX yang memetakan data forecast -> UI)
      include: [
        "src/lib/**/*.{ts,tsx}",
        // data layer wrappers are better covered by integration tests against Supabase;
        // keep unit coverage focused on deterministic logic.
        "src/components/notifications/**/*.{ts,tsx}",
        "src/components/popup/WeatherPopup.tsx",
        "src/components/controls/LanguageSelector.tsx",
      ],
      exclude: [
        "dist/**",
        "public/**",
        "supabase/**",
        "db/**",
        "src/components/ui/**",
        "src/test/**",
        "**/*.test.*",
        "**/*.spec.*",
        "**/*.d.ts",
        // konfigurasi/IO boundary yang biasanya dites via e2e/integration
        "src/lib/supabaseClient.ts",
        "src/lib/pushNotification.ts",
        "src/data/supabaseQueries.ts",
      ],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
    },
  },
}));
