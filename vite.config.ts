import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  base: "/",
  build: {
    target: "es2018",
    cssTarget: "chrome61",
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
