import { rmSync, existsSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

/**
 * Verifica se houve falhas nos testes verificando se existem arquivos de evidência
 * (screenshots, vídeos, traces) que indicam falhas
 * Para testes de API, verifica principalmente traces e arquivos de erro
 */
function hasTestFailures(testResultsDir: string): boolean {
  if (!existsSync(testResultsDir)) {
    return false;
  }

  try {
    const entries = readdirSync(testResultsDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        // Verificar se há arquivos de evidência de falhas
        const entryPath = join(testResultsDir, entry.name);
        const subEntries = readdirSync(entryPath, { recursive: true });
        
        // Verificar se há arquivos que indicam falhas claras:
        // - Arquivos com nomes que explicitamente indicam erros/falhas
        // - Screenshots (.png) - indicam falhas em testes de API (se configurados)
        // - Vídeos (.webm) - indicam falhas em testes de API (se configurados)
        // Nota: Traces (.zip) podem ser gerados mesmo em testes bem-sucedidos,
        // então não os consideramos como evidência de falha
        const hasErrorFiles = subEntries.some(file => {
          // Garantir que file é uma string
          const filePath = typeof file === 'string' ? file : String(file);
          const fileName = filePath.toLowerCase();
          return (
            fileName.includes('error') || 
            fileName.includes('failure') ||
            fileName.includes('failed') ||
            filePath.endsWith('.png') || // Screenshots (indicam falhas se existirem)
            filePath.endsWith('.webm') // Vídeos (indicam falhas se existirem)
          );
        });
        
        if (hasErrorFiles) {
          return true;
        }
      }
    }
  } catch (error) {
    // Se houver erro ao ler, assumir que pode haver falhas
    console.warn('Aviso ao verificar resultados dos testes:', error);
    return true;
  }

  return false;
}

/**
 * Script de limpeza dos arquivos temporários gerados pelos testes do Playwright
 * Executa apenas quando todos os testes passarem
 */
async function cleanup() {

  const currentDir = process.cwd();
  let backendDir: string;
  
  // Detectar diretório do backend
  if (currentDir.endsWith('e2e')) {
    backendDir = resolve(currentDir, '..');
  } else if (currentDir.endsWith('backend')) {
    backendDir = currentDir;
  } else {
    backendDir = resolve(currentDir, 'backend');
  }

  const testResultsDir = join(backendDir, 'test-results');
  
  // Verificar se houve falhas antes de limpar
  if (hasTestFailures(testResultsDir)) {
    console.log('⚠️  Alguns testes falharam. Mantendo arquivos temporários para análise.');
    return;
  }

  const directoriesToClean = [
    testResultsDir,
    join(backendDir, 'playwright-report'),
  ];

  console.log('🧹 Limpando arquivos temporários dos testes...');

  for (const dir of directoriesToClean) {
    if (existsSync(dir)) {
      try {
        rmSync(dir, { recursive: true, force: true });
        console.log(`✅ Removido: ${dir}`);
      } catch (error) {
        console.error(`❌ Erro ao remover ${dir}:`, error);
      }
    }
  }

  console.log('✨ Limpeza concluída!');
}

// Exportar função para o globalTeardown do Playwright
export default async function globalTeardown() {
  await cleanup();
}

