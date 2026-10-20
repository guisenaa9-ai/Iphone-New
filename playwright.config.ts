import { defineConfig, devices } from "@playwright/test";

// E2E contra uma loja rodando (padrão: http://localhost:3000) com os dados de supabase/seed.sql.
// Credenciais de um admin de TESTE via E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD.
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    locale: "pt-BR",
    trace: "retain-on-failure",
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : undefined,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
