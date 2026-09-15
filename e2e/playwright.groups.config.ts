import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './ui',
  testMatch: /groups\.acceptance\.e2e\.test\.ts/,
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:5183',
    headless: true,
  },
  webServer: [
    {
      command: 'cd ../server && PORT=3021 npx tsx src/index.ts',
      port: 3021,
      reuseExistingServer: true,
      timeout: 30000,
    },
    {
      command: 'cd ../client && npx vite --config vite.groups.config.ts',
      port: 5183,
      reuseExistingServer: true,
      timeout: 30000,
    },
  ],
})
