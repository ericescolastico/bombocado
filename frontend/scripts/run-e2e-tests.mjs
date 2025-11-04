#!/usr/bin/env node

/**
 * Script wrapper para executar limpeza de portas e depois os testes e2e
 */

import { spawn } from 'child_process';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

process.chdir(projectRoot);

// Função helper para executar comandos com spawn e promessa
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: true,
      windowsHide: true,
      ...options,
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function main() {
  try {
    // 1. Executar limpeza de portas (sempre continuar, mesmo com avisos)
    console.log('🔄 Executando limpeza de portas...\n');
    
    const cleanupScriptPath = resolve(projectRoot, 'scripts', 'clean-ports.mjs');
    
    try {
      // Executar limpeza com timeout para evitar travamentos
      // Usar caminho absoluto e garantir que o processo termine
      const cleanupPromise = new Promise((resolve, reject) => {
        const cleanupProcess = spawn('node', [cleanupScriptPath], {
          cwd: projectRoot,
          stdio: 'inherit',
          shell: false, // Não usar shell para evitar problemas
          windowsHide: true,
        });
        
        cleanupProcess.on('close', (code) => {
          resolve(code);
        });
        
        cleanupProcess.on('error', (error) => {
          reject(error);
        });
      });
      
      // Timeout de 60 segundos (aumentado para dar tempo de limpeza completa)
      await Promise.race([
        cleanupPromise,
        new Promise((resolve) => 
          setTimeout(() => {
            console.log('\n⚠️ Limpeza demorou mais que o esperado, continuando...\n');
            resolve(0);
          }, 60000)
        ),
      ]);
      
      // Aguardar um pouco mais para garantir que processos foram completamente encerrados
      console.log('\n⏳ Aguardando processos terminarem completamente...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('\n✅ Limpeza concluída, iniciando testes...\n');
    } catch (cleanError) {
      // Sempre continuar, mesmo se houver erros na limpeza
      console.log('\n⚠️ Continuando com os testes (limpeza pode ter tido avisos)...\n');
      // Aguardar mesmo assim
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // 2. Executar testes e2e
    console.log('🚀 Executando testes e2e...\n');
    await runCommand('npx', ['playwright', 'test', '--config', 'e2e/playwright.config.ts']);

    // Sucesso
    process.exit(0);
  } catch (error) {
    // Se houver erro nos testes, propagar o código de saída
    console.error('\n❌ Erro ao executar testes:', error.message);
    process.exit(1);
  }
}

main();
