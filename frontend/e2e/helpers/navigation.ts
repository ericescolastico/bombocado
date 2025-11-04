import { Page } from '@playwright/test';

/**
 * URL base padrão do frontend
 */
const DEFAULT_BASE_URL = 'http://localhost:3001';

/**
 * Obtém a URL base do contexto da página
 */
export function getBaseURL(page: Page): string {
  // Tenta obter do contexto do browser através das opções
  const context = page.context();
  const options = (context as any)._options || {};
  const baseURL = options.baseURL || process.env.FRONTEND_URL || DEFAULT_BASE_URL;
  // Remover todas as barras finais e espaços
  const cleanURL = baseURL.trim().replace(/\/+$/, '');
  return cleanURL;
}

/**
 * Navega para uma URL relativa, garantindo que o baseURL seja aplicado
 */
export async function goto(page: Page, url: string): Promise<void> {
  // Se a URL já é absoluta, usa diretamente
  if (url.startsWith('http://') || url.startsWith('https://')) {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    return;
  }
  
  // Obtém o baseURL e combina com a URL relativa
  const baseURL = getBaseURL(page);
  const cleanUrl = url.startsWith('/') ? url : '/' + url;
  const fullUrl = `${baseURL}${cleanUrl}`;
  
  await page.goto(fullUrl, { waitUntil: 'domcontentloaded' });
}

