import { defineConfig, devices } from '@playwright/test';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

// Detecta o diretório correto do frontend e backend
// O arquivo está em frontend/e2e/playwright.config.ts
// O Playwright executa os testes a partir do diretório onde está o package.json
// Quando rodamos npm run test:e2e de frontend/, process.cwd() é frontend/
const currentDir = process.cwd();

// Verificar se já estamos no diretório frontend (verificando se package.json existe)
// Usar resolve() para garantir caminhos absolutos no Windows
let frontendDir: string;
const packageJsonPath = resolve(currentDir, 'package.json');
if (existsSync(packageJsonPath)) {
  // Se package.json existe no diretório atual, estamos no frontend
  frontendDir = currentDir;
} else {
  // Tentar subir um nível (se estamos em frontend/e2e)
  const parentDir = resolve(currentDir, '..');
  const parentPackageJsonPath = resolve(parentDir, 'package.json');
  if (existsSync(parentPackageJsonPath)) {
    frontendDir = parentDir;
  } else {
    // Tentar adicionar 'frontend' (se estamos na raiz do projeto)
    frontendDir = resolve(currentDir, 'frontend');
  }
}

// Detectar diretório do backend (raiz do projeto)
const projectRoot = resolve(frontendDir, '..');
const backendDir = join(projectRoot, 'backend');

/**
 * Configuração do Playwright para testes E2E do frontend
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Usar 1 worker para evitar conflitos em desenvolvimento
  reporter: 'html',
  
  use: {
    // baseURL deve ser uma URL completa e válida (remover barra final se houver)
    baseURL: (process.env.FRONTEND_URL || 'http://localhost:3001')
      .trim()
      .replace(/\/+$/, ''),
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 45000, // Aumentado para sistemas mais lentos (Windows)
    navigationTimeout: 60000,
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Garantir que baseURL seja aplicado no projeto também
        baseURL: (process.env.FRONTEND_URL || 'http://localhost:3001')
          .trim()
          .replace(/\/+$/, ''),
      },
    },
    // Descomentar conforme necessário
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Configurar múltiplos servidores (backend e frontend)
  webServer: [
    // Backend (deve iniciar primeiro)
    {
      command: 'npm run start:dev',
      cwd: backendDir,
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI, // Reusar em desenvolvimento local
      timeout: 120000, // 2 minutos para o backend iniciar
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        ...process.env,
        PORT: '3000',
      },
    },
    // Frontend - Usar build de produção para evitar conflitos com app-build-manifest.json
    // Pode ser forçado com E2E_USE_PROD_BUILD=1 ou automaticamente em CI
    {
      command: (process.env.CI || process.env.E2E_USE_PROD_BUILD === '1') 
        ? 'npm run build && npm run start' 
        : 'npm run dev',
      cwd: frontendDir,
      url: 'http://localhost:3001',
      reuseExistingServer: !process.env.CI, // Reusar em desenvolvimento local
      timeout: (process.env.CI || process.env.E2E_USE_PROD_BUILD === '1') ? 300000 : 240000, // 5 minutos para build, 4 minutos para dev
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        ...process.env,
        PORT: '3001',
        NODE_ENV: (process.env.CI || process.env.E2E_USE_PROD_BUILD === '1') ? 'production' : 'development',
      },
    },
  ],

  globalTeardown: resolve(__dirname, 'cleanup.ts'),
});
