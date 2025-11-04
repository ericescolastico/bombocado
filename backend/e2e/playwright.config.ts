import { defineConfig, devices } from '@playwright/test';
import { join, resolve } from 'path';

// Detecta o diretório correto do backend
// Quando executado a partir de e2e, o backendDir é o diretório pai
const currentDir = process.cwd();
let backendDir: string;
if (currentDir.endsWith('e2e')) {
  // Executando a partir do diretório e2e
  backendDir = join(currentDir, '..');
} else if (currentDir.endsWith('backend')) {
  // Executando a partir do diretório backend
  backendDir = currentDir;
} else {
  // Executando a partir do diretório raiz do projeto
  backendDir = join(currentDir, 'backend');
}

/**
 * Configuração do Playwright para testes E2E do backend (API)
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: 'html',
  // Garantir que apenas arquivos do diretório e2e/tests sejam considerados
  testMatch: /.*\.spec\.ts$/,
  // Excluir arquivos de teste Jest do diretório src e outros diretórios
  testIgnore: [
    '**/src/**',
    '**/node_modules/**',
    '**/dist/**',
    '**/test/**',
    '**/coverage/**',
  ],
  
  use: {
    baseURL: process.env.BACKEND_URL || 'http://localhost:3000',
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
  },

  projects: [
    {
      name: 'api',
      use: {
        // Não precisa navegador para testes de API
      },
    },
  ],

  webServer: {
    command: 'npm run start:dev',
    cwd: backendDir,
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'ignore',
    stderr: 'pipe',
  },

  globalTeardown: resolve(__dirname, 'cleanup.ts'),
});
