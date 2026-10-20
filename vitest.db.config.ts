import { fileURLToPath } from "node:url";
import { loadEnvFile } from "node:process";
import { defineConfig } from "vitest/config";

try {
  loadEnvFile(".env.local");
} catch {}

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: { include: ["tests/integration/**/*.test.ts"], fileParallelism: false },
});
