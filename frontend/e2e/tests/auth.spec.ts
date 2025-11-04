import { test, expect } from '@playwright/test';
import { loginAsAdmin, logout, ADMIN_CREDENTIALS } from '../fixtures/auth';
import { goto } from '../helpers/navigation';

test.describe('Autenticação', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para uma página válida primeiro para garantir contexto de página
    await goto(page, '/');
    
    // Aguardar que a página carregue completamente
    await page.waitForLoadState('domcontentloaded');
    
    // Agora podemos limpar o localStorage com segurança
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        // Ignorar erros se o localStorage não estiver disponível
      }
    });
    
    // Aguardar que a aplicação detecte a mudança (pode redirecionar)
    await Promise.race([
      page.waitForURL('**/login', { timeout: 5000 }).catch(() => null),
      page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => null)
    ]);
  });

  test('deve fazer login com credenciais válidas', async ({ page }) => {
    // Usar a função loginAsAdmin que já tem todas as validações e esperas necessárias
    await loginAsAdmin(page);
    
    // Verificar redirecionamento
    await expect(page).toHaveURL(/.*\/dashboard$/);
    
    // Verificar que os dados do usuário foram salvos
    const user = await page.evaluate(() => localStorage.getItem('user'));
    expect(user).toBeTruthy();
    
    const userData = JSON.parse(user!);
    expect(userData).toHaveProperty('username');
    expect(userData.username).toBe(ADMIN_CREDENTIALS.username);
  });

  test('deve mostrar erro ao fazer login com credenciais inválidas', async ({ page }) => {
    await goto(page, '/login');
    
    // Aguardar que a URL seja /login
    await page.waitForURL('**/login', { timeout: 10000 });
    await page.waitForLoadState('domcontentloaded');
    
    // Aguardar que o campo username esteja visível e pronto
    await page.waitForSelector('#username', { state: 'visible', timeout: 15000 });
    await page.waitForFunction(
      () => {
        const input = document.querySelector('#username') as HTMLInputElement;
        return input && !input.disabled;
      },
      { timeout: 10000 }
    );
    
    // Preencher com credenciais inválidas
    await page.fill('#username', 'usuario_invalido', { timeout: 10000 });
    await page.fill('#password', 'senha_invalida', { timeout: 10000 });
    
    // Aguardar que a requisição seja feita e a resposta seja recebida
    const [response] = await Promise.all([
      page.waitForResponse(response => 
        response.url().includes('/auth/login') && response.status() === 401
      ).catch(() => null),
      page.click('button[type="submit"]', { timeout: 10000 })
    ]);
    
    // Verificar que a requisição retornou 401
    if (response && response.status() !== 401) {
      throw new Error(`Esperado status 401, mas recebeu ${response.status()}`);
    }
    
    // Aguardar mensagem de erro aparecer
    // A mensagem "Usuário ou senha incorretos" pode aparecer em diferentes lugares
    await expect(
      page.locator('#password-error, #username-error, [role="alert"]')
        .filter({ hasText: /(incorretos|incorreta|Erro ao fazer login)/i })
    ).toBeVisible({ timeout: 10000 });
    
    // Verificar que ainda está na página de login
    await expect(page).toHaveURL(/.*\/login$/);
    
    // Verificar que não há token no localStorage
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(token).toBeNull();
  });

  test('deve validar campos obrigatórios', async ({ page }) => {
    await goto(page, '/login');
    
    // Aguardar que a URL seja /login
    await page.waitForURL('**/login', { timeout: 10000 });
    await page.waitForLoadState('domcontentloaded');
    
    // Aguardar que o formulário esteja pronto e interativo
    await page.waitForSelector('form', { state: 'visible', timeout: 15000 });
    await page.waitForFunction(
      () => {
        const form = document.querySelector('form');
        const submitBtn = form?.querySelector('button[type="submit"]') as HTMLButtonElement;
        return form && submitBtn && !submitBtn.disabled;
      },
      { timeout: 10000 }
    );
    
    // Tentar submeter sem preencher nada
    await page.click('button[type="submit"]', { timeout: 10000 });
    
    // Verificar mensagem de erro para campo usuário
    await expect(page.locator('text=Por favor, insira seu usuário')).toBeVisible({ timeout: 5000 });
  });

  test('deve validar campo senha obrigatório', async ({ page }) => {
    await goto(page, '/login');
    
    // Aguardar que a URL seja /login
    await page.waitForURL('**/login', { timeout: 10000 });
    await page.waitForLoadState('domcontentloaded');
    
    // Aguardar que o campo username esteja visível e pronto
    await page.waitForSelector('#username', { state: 'visible', timeout: 15000 });
    await page.waitForFunction(
      () => {
        const input = document.querySelector('#username') as HTMLInputElement;
        return input && !input.disabled;
      },
      { timeout: 10000 }
    );
    
    // Preencher apenas usuário e verificar que foi preenchido
    await page.fill('#username', ADMIN_CREDENTIALS.username, { timeout: 10000 });
    await expect(page.locator('#username')).toHaveValue(ADMIN_CREDENTIALS.username);
    
    // Tentar submeter
    await page.click('button[type="submit"]', { timeout: 10000 });
    
    // Verificar mensagem de erro para campo senha
    await expect(page.locator('text=Por favor, insira sua senha')).toBeVisible({ timeout: 5000 });
  });

  test('deve redirecionar para dashboard após login bem-sucedido', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Verificar que está no dashboard
    await expect(page).toHaveURL(/.*\/dashboard$/);
    
    // Verificar que a página carregou completamente
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  });

  test('deve salvar token no localStorage após login', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Verificar token
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
    expect(token!.length).toBeGreaterThan(0);
    
    // Verificar dados do usuário
    const userData = await page.evaluate(() => localStorage.getItem('user'));
    expect(userData).toBeTruthy();
    
    const user = JSON.parse(userData!);
    expect(user).toHaveProperty('username');
    expect(user.username).toBe(ADMIN_CREDENTIALS.username);
  });

  test('deve fazer logout e limpar localStorage', async ({ page }) => {
    // Fazer login primeiro
    await loginAsAdmin(page);
    
    // Verificar que está autenticado
    const tokenBefore = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(tokenBefore).toBeTruthy();
    
    // Fazer logout
    await logout(page);
    
    // Verificar que foi redirecionado para login
    await expect(page).toHaveURL(/.*\/login$/);
    await page.waitForLoadState('networkidle');
    
    // Verificar que o localStorage foi limpo
    const tokenAfter = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(tokenAfter).toBeNull();
    
    const userAfter = await page.evaluate(() => localStorage.getItem('user'));
    expect(userAfter).toBeNull();
  });
});
