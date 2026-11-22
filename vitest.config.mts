import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    coverage: {
      provider: "v8",
      // Count every source file, not only the ones a test imports, so
      // untested files show up as 0% instead of being left out.
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/__tests__/**"],
      reporter: ["text", "html", "lcov"],
      // The 70% threshold is added in #39.
    },
  },
});
