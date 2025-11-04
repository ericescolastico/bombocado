import { Page, expect } from '@playwright/test';
import { getBaseURL, goto } from '../helpers/navigation';

/**
 * Credenciais padrão do admin (do seed do banco)
 */
export const ADMIN_CREDENTIALS = {
  username: 'ADMIN',
  password: 'ADMIN123',
};

/**
 * Faz login no sistema como admin
 * @param page - Página do Playwright
 * @returns Promise que resolve quando o login é concluído
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  // Navegar para a página de login primeiro
  await goto(page, '/login');
  
  // Aguardar que a URL seja /login (pode levar um tempo se houver redirecionamentos)
  await page.waitForURL('**/login', { timeout: 10000 });
  
  // Aguardar a página de login estar completamente carregada
  await page.waitForLoadState('domcontentloaded');
  
  // Limpar qualquer autenticação existente agora que a página está carregada
  await page.evaluate(() => {
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    } catch (e) {
      // Ignorar erros se o localStorage não estiver disponível
    }
  });
  
  // Aguardar que o campo username esteja visível e pronto para interação
  // Usar um seletor mais específico e aguardar que esteja realmente interativo
  await page.waitForSelector('#username', { state: 'visible', timeout: 15000 });
  
  // Aguardar que o campo não esteja desabilitado (caso a página ainda esteja carregando)
  await page.waitForFunction(
    () => {
      const input = document.querySelector('#username') as HTMLInputElement;
      return input && !input.disabled;
    },
    { timeout: 10000 }
  );
  
  // Aguardar que o formulário esteja pronto e interativo
  await page.waitForSelector('form', { state: 'visible' });
  await page.waitForFunction(
    () => {
      const form = document.querySelector('form');
      const username = document.querySelector('#username') as HTMLInputElement;
      const password = document.querySelector('#password') as HTMLInputElement;
      return form && username && password && 
             !username.disabled && !password.disabled;
    },
    { timeout: 10000 }
  );
  
  // Preencher campos de login e verificar que foram preenchidos
  await page.fill('#username', ADMIN_CREDENTIALS.username, { timeout: 10000 });
  await expect(page.locator('#username')).toHaveValue(ADMIN_CREDENTIALS.username);
  await page.fill('#password', ADMIN_CREDENTIALS.password, { timeout: 10000 });
  await expect(page.locator('#password')).toHaveValue(ADMIN_CREDENTIALS.password);
  
  // Verificar que os valores foram preenchidos antes de submeter
  const usernameValue = await page.inputValue('#username');
  const passwordValue = await page.inputValue('#password');
  
  if (usernameValue !== ADMIN_CREDENTIALS.username || !passwordValue) {
    throw new Error('Falha ao preencher campos de login');
  }
  
  // Submeter formulário e aguardar requisição de login
  const [response] = await Promise.all([
    page.waitForResponse(
      response => response.url().includes('/auth/login') && response.status() === 201,
      { timeout: 20000 }
    ).catch(() => null),
    page.click('button[type="submit"]', { timeout: 10000 })
  ]);
  
  // Verificar que o login foi bem-sucedido
  if (response && response.status() !== 201) {
    throw new Error(`Login falhou com status ${response.status()}`);
  }
  
  // Aguardar redirecionamento para dashboard
  await page.waitForURL('**/dashboard', { timeout: 20000 });
  
  // Aguardar página carregar completamente
  await page.waitForLoadState('networkidle', { timeout: 15000 });
  
  // Verificar que o token foi salvo
  const token = await page.evaluate(() => localStorage.getItem('access_token'));
  if (!token) {
    throw new Error('Token de autenticação não foi salvo após login');
  }
}

/**
 * Faz logout do sistema
 * @param page - Página do Playwright
 */
export async function logout(page: Page): Promise<void> {
  // Navegar para logout ou página inicial primeiro
  await goto(page, '/');
  
  // Aguardar que a página carregue
  await page.waitForLoadState('domcontentloaded');
  
  // Limpar localStorage agora que a página está carregada
  await page.evaluate(() => {
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    } catch (e) {
      // Ignorar erros se o localStorage não estiver disponível
    }
  });
  
  // Aguardar redirecionamento para login
  await page.waitForURL('**/login', { timeout: 20000 });
  await page.waitForLoadState('networkidle', { timeout: 15000 });
}

/**
 * Navega para uma URL já autenticado
 * @param page - Página do Playwright
 * @param url - URL para navegar
 */
export async function navigateAsAuthenticated(page: Page, url: string): Promise<void> {
  // Fazer login primeiro
  await loginAsAdmin(page);
  
  // Aguardar que a página do dashboard esteja completamente carregada
  await page.waitForLoadState('networkidle', { timeout: 15000 });
  
  // Verificar que o token está salvo antes de navegar
  const token = await page.evaluate(() => localStorage.getItem('access_token'));
  if (!token) {
    throw new Error('Token não encontrado após login');
  }
  
  // Navegar para a URL desejada
  await goto(page, url);
  
  // Aguardar navegação completa e URL estar correta
  await page.waitForURL(`**${url}`, { timeout: 20000 });
  await page.waitForLoadState('networkidle', { timeout: 15000 });
}
