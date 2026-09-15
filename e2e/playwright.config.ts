import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './ui',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  webServer: [
    {
      command: 'cd ../server && npx tsx src/index.ts',
      port: 3001,
      reuseExistingServer: true,
      timeout: 30000,
    },
    {
      command: 'cd ../client && npx vite --port 5173',
      port: 5173,
      reuseExistingServer: true,
      timeout: 30000,
    },
  ],
})
