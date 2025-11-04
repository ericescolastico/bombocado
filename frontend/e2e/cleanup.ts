import { rmSync, existsSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

/**
 * Verifica se houve falhas nos testes verificando se existem arquivos de evidência
 * (screenshots, vídeos, traces) que indicam falhas
 * Retorna true se houver qualquer evidência de falha, false se todos passaram
 */
function hasTestFailures(testResultsDir: string): boolean {
  // Se não existir o diretório de resultados, não há falhas conhecidas
  if (!existsSync(testResultsDir)) {
    return false;
  }

  try {
    const entries = readdirSync(testResultsDir, { withFileTypes: true });
    
    // Se não houver entradas, todos os testes passaram
    if (entries.length === 0) {
      return false;
    }
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        // Verificar se há arquivos de evidência de falhas
        const entryPath = join(testResultsDir, entry.name);
        
        // Verificar se o diretório existe e tem conteúdo
        if (!existsSync(entryPath)) {
          continue;
        }
        
        const subEntries = readdirSync(entryPath, { recursive: true });
        
        // Verificar se há screenshots, vídeos ou traces que indicam falhas
        // Screenshots e vídeos são gerados apenas em falhas (only-on-failure, retain-on-failure)
        // Traces são gerados em retries, que indicam falhas anteriores
        const hasEvidenceFiles = subEntries.some(file => {
          // Garantir que file é uma string
          const filePath = typeof file === 'string' ? file : String(file);
          return (
            filePath.endsWith('.png') || // Screenshots (only-on-failure)
            filePath.endsWith('.webm') || // Vídeos (retain-on-failure)
            filePath.endsWith('.zip') // Traces (on-first-retry - indica falha que foi corrigida)
          );
        });
        
        // Se encontrar qualquer evidência de falha, retornar true
        if (hasEvidenceFiles) {
          return true;
        }
      }
    }
    
    // Se chegou aqui, não encontrou evidências de falhas
    return false;
  } catch (error) {
    // Se houver erro ao ler, assumir que pode haver falhas para segurança
    console.warn('⚠️  Aviso ao verificar resultados dos testes:', error);
    return true; // Em caso de dúvida, não limpar
  }
}

/**
 * Script de limpeza dos arquivos temporários gerados pelos testes do Playwright
 * Executa apenas quando todos os testes passarem
 */
async function cleanup() {

  const currentDir = process.cwd();
  let frontendDir: string;
  
  // Detectar diretório do frontend
  const packageJsonPath = resolve(currentDir, 'package.json');
  if (existsSync(packageJsonPath)) {
    frontendDir = currentDir;
  } else {
    const parentDir = resolve(currentDir, '..');
    const parentPackageJsonPath = resolve(parentDir, 'package.json');
    if (existsSync(parentPackageJsonPath)) {
      frontendDir = parentDir;
    } else {
      frontendDir = resolve(currentDir, 'frontend');
    }
  }

  const testResultsDir = join(frontendDir, 'test-results');
  
  // Verificar se houve falhas antes de limpar
  // Só limpar se TODOS os testes passarem (sem evidências de falhas)
  if (hasTestFailures(testResultsDir)) {
    console.log('⚠️  Alguns testes falharam. Mantendo arquivos temporários para análise.');
    console.log('⚠️  A pasta .next não será limpa devido a falhas nos testes.');
    return;
  }

  // Só executar limpeza se todos os testes passaram
  console.log('✅ Todos os testes passaram! Iniciando limpeza de arquivos temporários...');
  
  const directoriesToClean = [
    testResultsDir,
    join(frontendDir, 'playwright-report'),
    join(frontendDir, '.next'), // Limpar pasta .next do Next.js
    join(frontendDir, 'node_modules', '.cache'), // Limpar cache do node_modules
  ];

  for (const dir of directoriesToClean) {
    if (existsSync(dir)) {
      try {
        rmSync(dir, { recursive: true, force: true });
        console.log(`✅ Removido: ${dir}`);
      } catch (error) {
        console.error(`❌ Erro ao remover ${dir}:`, error);
      }
    } else {
      console.log(`ℹ️  Diretório não existe (já foi limpo?): ${dir}`);
    }
  }

  console.log('✨ Limpeza concluída! Todos os arquivos temporários foram removidos.');
}

// Exportar função para o globalTeardown do Playwright
export default async function globalTeardown() {
  await cleanup();
}

