import { test, expect } from '@playwright/test';
import { navigateAsAuthenticated, loginAsAdmin } from '../fixtures/auth';
import { goto } from '../helpers/navigation';

test.describe('Navegação', () => {
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

  test('deve navegar para Dashboard', async ({ page }) => {
    await navigateAsAuthenticated(page, '/dashboard');
    await expect(page).toHaveURL('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('deve navegar para Perfil - Editar Informações', async ({ page }) => {
    await navigateAsAuthenticated(page, '/perfil/editar-informacoes');
    await expect(page).toHaveURL('/perfil/editar-informacoes');
    await page.waitForLoadState('networkidle');
  });

  test('deve navegar para Perfil - Estatísticas', async ({ page }) => {
    await navigateAsAuthenticated(page, '/perfil/estatisticas');
    await expect(page).toHaveURL('/perfil/estatisticas');
    await page.waitForLoadState('networkidle');
  });

  test('deve navegar para Perfil - Log Atividades', async ({ page }) => {
    await navigateAsAuthenticated(page, '/perfil/log-atividades');
    await expect(page).toHaveURL('/perfil/log-atividades');
    await page.waitForLoadState('networkidle');
  });

  test('deve navegar para Usuários - Painel Controle', async ({ page }) => {
    await navigateAsAuthenticated(page, '/usuarios/painel-controle');
    await expect(page).toHaveURL('/usuarios/painel-controle');
    await page.waitForLoadState('networkidle');
  });

  test('deve navegar para Usuários - Log Atividades', async ({ page }) => {
    await navigateAsAuthenticated(page, '/usuarios/log-atividades');
    await expect(page).toHaveURL('/usuarios/log-atividades');
    await page.waitForLoadState('networkidle');
  });

  test('deve navegar para Atendimentos - Fluxo', async ({ page }) => {
    await navigateAsAuthenticated(page, '/atendimentos/fluxo');
    await expect(page).toHaveURL('/atendimentos/fluxo');
    await page.waitForLoadState('networkidle');
  });

  test('deve navegar para Configurações', async ({ page }) => {
    await navigateAsAuthenticated(page, '/configuracoes');
    await expect(page).toHaveURL('/configuracoes');
    await page.waitForLoadState('networkidle');
  });

  test('deve redirecionar para login ao acessar rota protegida sem autenticação', async ({ page }) => {
    // Limpar autenticação
    await goto(page, '/');
    await page.waitForLoadState('domcontentloaded');
    
    await page.evaluate(() => {
      try {
        localStorage.clear();
      } catch (e) {
        // Ignorar erros se o localStorage não estiver disponível
      }
    });
    
    // Aguardar que a aplicação detecte a mudança
    await Promise.race([
      page.waitForURL('**/login', { timeout: 5000 }).catch(() => null),
      page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => null)
    ]);
    
    // Tentar acessar rota protegida
    await goto(page, '/dashboard');
    
    // Aguardar redirecionamento para login (aumentar timeout para dar tempo da validação)
    await page.waitForURL('**/login', { timeout: 20000 });
    
    // Verificar que foi redirecionado
    await expect(page).toHaveURL(/.*\/login$/);
    
    // Aguardar página de login estar pronta
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  });

  test('deve manter autenticação ao navegar entre páginas', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Navegar para várias páginas
    await goto(page, '/dashboard');
    await expect(page).toHaveURL('/dashboard');
    
    await goto(page, '/perfil/editar-informacoes');
    await expect(page).toHaveURL('/perfil/editar-informacoes');
    
    await goto(page, '/atendimentos/fluxo');
    await expect(page).toHaveURL('/atendimentos/fluxo');
    
    // Verificar que ainda está autenticado
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(token).toBeTruthy();
  });

  test('deve redirecionar de / para /dashboard quando autenticado', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Aguardar que a página do dashboard esteja completamente carregada
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Verificar que o token está salvo
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(token).toBeTruthy();
    
    // Navegar para raiz
    await goto(page, '/');
    
    // Aguardar redirecionamento
    await page.waitForURL('**/dashboard', { timeout: 20000 });
    
    // Verificar redirecionamento
    await expect(page).toHaveURL(/.*\/dashboard$/);
    
    // Aguardar página carregar completamente
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  });

  test('deve redirecionar de / para /login quando não autenticado', async ({ page }) => {
    // Limpar autenticação
    await goto(page, '/');
    await page.waitForLoadState('domcontentloaded');
    
    await page.evaluate(() => {
      try {
        localStorage.clear();
      } catch (e) {
        // Ignorar erros se o localStorage não estiver disponível
      }
    });
    
    // Aguardar que a aplicação detecte a mudança
    await Promise.race([
      page.waitForURL('**/login', { timeout: 5000 }).catch(() => null),
      page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => null)
    ]);
    
    // Navegar para raiz
    await goto(page, '/');
    
    // Aguardar redirecionamento (aumentar timeout para dar tempo da validação)
    await page.waitForURL('**/login', { timeout: 20000 });
    
    // Verificar redirecionamento
    await expect(page).toHaveURL(/.*\/login$/);
    
    // Aguardar página de login estar pronta
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  });
});
