#!/usr/bin/env node

/**
 * Script para limpar processos que estão usando as portas 3000 e 3001
 * e também limpar o diretório .next do Next.js
 * Funciona no Windows usando PowerShell
 */

import { execSync, spawn } from 'child_process';
import { platform } from 'os';
import { existsSync, rmSync, readdirSync, unlinkSync, statSync } from 'fs';
import { resolve } from 'path';

const ports = [3000, 3001];

function killProcessOnPortWindows(port) {
  try {
    // Encontrar o PID do processo usando a porta
    const netstatCmd = `netstat -ano | findstr :${port}`;
    const output = execSync(netstatCmd, { encoding: 'utf-8', stdio: 'pipe' });
    
    const lines = output.trim().split('\n');
    const pids = new Set();
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      // Validar que o PID existe, é numérico, não é 0 e não é o processo atual
      if (pid && /^\d+$/.test(pid)) {
        const pidNum = parseInt(pid, 10);
        // Ignorar PID 0 (processo crítico do sistema) e PID negativo
        if (pidNum > 0 && pidNum !== process.pid) {
          pids.add(pid);
        }
      }
    }
    
    // Matar todos os processos encontrados
    for (const pid of pids) {
      try {
        const pidNum = parseInt(pid, 10);
        // Validação adicional antes de tentar encerrar
        if (pidNum <= 0 || pidNum === process.pid) {
          continue;
        }
        
        console.log(`[clean-ports] Encerrando processo ${pid} na porta ${port}...`);
        execSync(`taskkill /F /PID ${pid}`, { encoding: 'utf-8', stdio: 'ignore' });
        console.log(`[clean-ports] ✓ Processo ${pid} encerrado com sucesso`);
      } catch (error) {
        // Ignorar erros se o processo já não existir ou for processo crítico
        if (!error.message.includes('não foi encontrado') && 
            !error.message.includes('processo de sistema crítico') &&
            !error.message.includes('crítico')) {
          console.warn(`[clean-ports] Aviso ao encerrar processo ${pid}: ${error.message}`);
        }
      }
    }
    
    if (pids.size === 0) {
      console.log(`[clean-ports] Nenhum processo encontrado na porta ${port}`);
    }
  } catch (error) {
    // Se não encontrar nenhum processo, isso é OK
    if (error.message.includes('findstr')) {
      console.log(`[clean-ports] Nenhum processo encontrado na porta ${port}`);
    } else {
      console.warn(`[clean-ports] Erro ao verificar porta ${port}: ${error.message}`);
    }
  }
}

function killProcessOnPortUnix(port) {
  try {
    // Encontrar o PID do processo usando a porta (Linux/Mac)
    const lsofCmd = `lsof -ti:${port}`;
    const pids = execSync(lsofCmd, { encoding: 'utf-8', stdio: 'pipe' })
      .trim()
      .split('\n')
      .filter(pid => pid.trim());
    
    // Matar todos os processos encontrados
    for (const pid of pids) {
      try {
        console.log(`[clean-ports] Encerrando processo ${pid} na porta ${port}...`);
        execSync(`kill -9 ${pid}`, { encoding: 'utf-8', stdio: 'pipe' });
        console.log(`[clean-ports] ✓ Processo ${pid} encerrado com sucesso`);
      } catch (error) {
        console.warn(`[clean-ports] Aviso ao encerrar processo ${pid}: ${error.message}`);
      }
    }
    
    if (pids.length === 0) {
      console.log(`[clean-ports] Nenhum processo encontrado na porta ${port}`);
    }
  } catch (error) {
    // Se não encontrar nenhum processo, isso é OK
    console.log(`[clean-ports] Nenhum processo encontrado na porta ${port}`);
  }
}

async function killNodeProcessesWindows() {
  try {
    const currentPid = process.pid.toString();
    const pids = new Set();
    
    // Usar apenas tasklist - mais rápido e não trava como wmic
    // Não verificar command line para evitar travamentos
    try {
      const tasklistCmd = `tasklist /FI "IMAGENAME eq node.exe" /FO CSV`;
      const output = execSync(tasklistCmd, { 
        encoding: 'utf-8', 
        stdio: 'pipe',
        maxBuffer: 1024 * 1024, // 1MB buffer
      });
      const lines = output.trim().split('\n').slice(1); // Pular cabeçalho
      
      for (const line of lines) {
        if (!line.trim()) continue;
        const match = line.match(/"node\.exe","(\d+)"/);
        if (match) {
          const pid = match[1];
          if (pid !== currentPid) {
            pids.add(pid);
          }
        }
      }
    } catch (tasklistError) {
      console.warn('[clean-ports] Não foi possível listar processos Node.js:', tasklistError.message);
      return; // Sair se não conseguir listar
    }
    
    if (pids.size === 0) {
      console.log('[clean-ports] Nenhum processo Node.js adicional encontrado');
      return;
    }
    
    // Matar processos encontrados com timeout muito agressivo para evitar travamentos
    // Limitar a 5 processos por vez para evitar travamentos
    const pidsArray = Array.from(pids).slice(0, 5);
    
    for (const pid of pidsArray) {
      try {
                console.log(`[clean-ports] Encerrando processo Node.js ${pid}...`);
        
                 // Usar execSync simples - mais rápido que spawn e não trava
         // Com try/catch para ignorar erros e timeout via Promise.race
         await Promise.race([
           new Promise((resolve) => {
             try {
               execSync(`taskkill /F /PID ${pid}`, { 
                 encoding: 'utf-8', 
                 stdio: 'ignore',
               });
               console.log(`[clean-ports] ✓ Processo Node.js ${pid} encerrado`);
               resolve();
             } catch (error) {
               // Código 128 = processo não encontrado (OK)
               if (error.status === 128) {
                 console.log(`[clean-ports] ✓ Processo Node.js ${pid} não encontrado (já encerrado)`);
               }
               // Ignorar outros erros e continuar
               resolve();
             }
           }),
           // Timeout de segurança de 1 segundo
           new Promise((resolve) => {
             setTimeout(() => {
               console.log(`[clean-ports] ⚠️ Timeout ao encerrar processo ${pid}, continuando...`);
               resolve();
             }, 1000);
           }),
         ]);
      } catch (error) {
        // Ignorar todos os erros e continuar
        console.log(`[clean-ports] ⚠️ Erro ao encerrar processo ${pid}, continuando...`);
      }
    }
    
    if (pids.size > 5) {
      console.log(`[clean-ports] ⚠️ Limite de 5 processos alcançado, ${pids.size - 5} processos restantes ignorados`);
    }
  } catch (error) {
    console.warn(`[clean-ports] Erro ao verificar processos Node.js: ${error.message}`);
  }
}

function killNodeProcessesUnix() {
  try {
    console.log('[clean-ports] Encerrando processos Node.js relacionados ao Next.js...');
    
    // Encontrar processos Node.js (exceto o atual)
    const currentPid = process.pid;
    const pids = execSync(`pgrep -f "node.*next"`, { encoding: 'utf-8', stdio: 'pipe' })
      .trim()
      .split('\n')
      .filter(pid => pid.trim() && parseInt(pid) !== currentPid);
    
    for (const pid of pids) {
      try {
        console.log(`[clean-ports] Encerrando processo Node.js ${pid}...`);
        execSync(`kill -9 ${pid}`, { encoding: 'utf-8', stdio: 'pipe' });
        console.log(`[clean-ports] ✓ Processo Node.js ${pid} encerrado`);
      } catch (error) {
        console.warn(`[clean-ports] Aviso ao encerrar processo ${pid}: ${error.message}`);
      }
    }
    
    if (pids.length === 0) {
      console.log('[clean-ports] Nenhum processo Node.js adicional encontrado');
    }
  } catch (error) {
    console.log('[clean-ports] Nenhum processo Node.js encontrado');
  }
}

/**
 * Limpa um diretório com múltiplas tentativas
 */
function cleanDirectory(dirPath, dirName) {
  if (!existsSync(dirPath)) {
    console.log(`[clean-ports] Diretório ${dirName} não encontrado, pulando limpeza`);
    return;
  }

  console.log(`[clean-ports] Limpando diretório ${dirName}...`);
  
  // Tentar múltiplas vezes com diferentes métodos
  let success = false;
  const maxAttempts = 5; // Aumentar tentativas
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (attempt === 1) {
        // Primeira tentativa: método padrão
        rmSync(dirPath, { recursive: true, force: true });
      } else if (attempt === 2 && platform() === 'win32') {
        // Segunda tentativa no Windows: usar rmdir com mais força
        console.log(`[clean-ports] Tentativa ${attempt}: usando rmdir...`);
        execSync(`rmdir /s /q "${dirPath}"`, { encoding: 'utf-8', stdio: 'ignore' });
      } else if (attempt === 3 && platform() === 'win32') {
        // Terceira tentativa: tentar remover arquivos individuais primeiro
        console.log(`[clean-ports] Tentativa ${attempt}: removendo arquivos individualmente...`);
        try {
          function removeDirRecursive(dir) {
            const files = readdirSync(dir);
            for (const file of files) {
              const filePath = resolve(dir, file);
              const stat = statSync(filePath);
              if (stat.isDirectory()) {
                removeDirRecursive(filePath);
              } else {
                try {
                  unlinkSync(filePath);
                } catch (e) {
                  // Ignorar erros de arquivo bloqueado
                }
              }
            }
            try {
              rmSync(dir, { recursive: true, force: true });
            } catch (e) {
              // Ignorar
            }
          }
          removeDirRecursive(dirPath);
        } catch (e) {
          // Se falhar, tentar próximo método
        }
      } else if (attempt === 4 && platform() === 'win32') {
        // Quarta tentativa: usar PowerShell para forçar remoção
        console.log(`[clean-ports] Tentativa ${attempt}: usando PowerShell...`);
        try {
          const normalizedPath = dirPath.replace(/\\/g, '/');
          execSync(`powershell -Command "Start-Sleep -Milliseconds 500; if (Test-Path '${normalizedPath}') { Remove-Item -Recurse -Force '${normalizedPath}' -ErrorAction SilentlyContinue }"`, 
            { encoding: 'utf-8', stdio: 'ignore', timeout: 5000 });
        } catch (e) {
          // Ignorar erros
        }
      } else {
        // Última tentativa: método padrão novamente
        console.log(`[clean-ports] Tentativa ${attempt}: método padrão...`);
        rmSync(dirPath, { recursive: true, force: true });
      }
      
      // Aguardar um pouco para garantir que o sistema operacional liberou os locks
      if (platform() === 'win32') {
        try {
          execSync('timeout /t 1 /nobreak >nul 2>&1', { encoding: 'utf-8', stdio: 'ignore' });
        } catch (e) {
          // Ignorar
        }
      } else {
        try {
          execSync('sleep 1', { encoding: 'utf-8', stdio: 'ignore' });
        } catch (e) {
          // Ignorar
        }
      }
      
      // Verificar se foi removido
      if (!existsSync(dirPath)) {
        console.log(`[clean-ports] ✓ Diretório ${dirName} removido com sucesso (tentativa ${attempt})`);
        success = true;
        break;
      }
    } catch (error) {
      if (attempt < maxAttempts) {
        console.warn(`[clean-ports] Tentativa ${attempt} falhou para ${dirName}: ${error.message}`);
        // Aguardar um pouco antes de tentar novamente (aumentar tempo de espera)
        try {
          if (platform() === 'win32') {
            execSync('timeout /t 2 /nobreak >nul 2>&1', { encoding: 'utf-8', stdio: 'ignore' });
          } else {
            execSync('sleep 2', { encoding: 'utf-8', stdio: 'ignore' });
          }
        } catch (e) {
          // Ignorar
        }
      } else {
        console.warn(`[clean-ports] Não foi possível remover ${dirName} após ${maxAttempts} tentativas: ${error.message}`);
      }
    }
  }
  
  if (!success && existsSync(dirPath)) {
    console.warn(`[clean-ports] ⚠ Aviso: Diretório ${dirName} ainda existe após tentativas de limpeza`);
    console.warn(`[clean-ports] Você pode precisar fechar outros processos que estão usando esses arquivos`);
  }
}

function cleanNextDirectory() {
  const currentDir = process.cwd();
  const nextDir = resolve(currentDir, '.next');
  cleanDirectory(nextDir, '.next');
}

/**
 * Limpa diretórios temporários do Playwright
 */
function cleanPlaywrightDirectories() {
  const currentDir = process.cwd();
  const testResultsDir = resolve(currentDir, 'test-results');
  const playwrightReportDir = resolve(currentDir, 'playwright-report');
  
  console.log('\n[clean-ports] Limpando diretórios temporários do Playwright...');
  cleanDirectory(testResultsDir, 'test-results');
  cleanDirectory(playwrightReportDir, 'playwright-report');
}

/**
 * Limpa cache do node_modules
 */
function cleanNodeModulesCache() {
  const currentDir = process.cwd();
  const nodeModulesCacheDir = resolve(currentDir, 'node_modules', '.cache');
  
  console.log('\n[clean-ports] Limpando cache do node_modules...');
  cleanDirectory(nodeModulesCacheDir, 'node_modules/.cache');
}

// Função principal async para executar a limpeza
async function main() {
  try {
    console.log('[clean-ports] Iniciando limpeza completa...\n');

    // Primeiro, limpar processos nas portas
    console.log('[clean-ports] Limpando portas 3000 e 3001...\n');
    const isWindows = platform() === 'win32';

    for (const port of ports) {
      if (isWindows) {
        killProcessOnPortWindows(port);
      } else {
        killProcessOnPortUnix(port);
      }
    }

    // Aguardar um pouco para garantir que processos foram encerrados
    console.log('\n[clean-ports] Aguardando processos encerrarem...');
    try {
      if (isWindows) {
        execSync('timeout /t 2 /nobreak >nul 2>&1', { encoding: 'utf-8', stdio: 'ignore' });
      } else {
        execSync('sleep 2', { encoding: 'utf-8', stdio: 'ignore' });
      }
    } catch (error) {
      // Ignorar erros do timeout
    }

    // Matar processos Node.js que podem estar bloqueando arquivos do .next
    // DESABILITADO por padrão devido a problemas de travamento no Windows
    // Pode ser habilitado com CLEAN_NODE_PROCESSES=1
    if (process.env.CLEAN_NODE_PROCESSES === '1') {
      console.log('\n[clean-ports] Verificando processos Node.js que podem estar bloqueando arquivos...\n');
      try {
        await Promise.race([
          (async () => {
            if (isWindows) {
              await killNodeProcessesWindows();
            } else {
              killNodeProcessesUnix();
            }
          })(),
          new Promise((resolve) => {
            setTimeout(() => {
              console.log('[clean-ports] ⚠️ Timeout ao verificar processos Node.js (3s), continuando...');
              resolve();
            }, 3000); // 3 segundos timeout máximo
          }),
        ]);
      } catch (error) {
        console.warn('[clean-ports] Erro ao verificar processos Node.js:', error.message);
      }
    } else {
      console.log('\n[clean-ports] Verificação de processos Node.js desabilitada por padrão (pode habilitar com CLEAN_NODE_PROCESSES=1)\n');
    }

    // Aguardar mais um pouco antes de limpar cache para garantir que locks foram liberados
    console.log('\n[clean-ports] Aguardando processos encerrarem completamente e locks serem liberados...');
    try {
      if (isWindows) {
        execSync('timeout /t 2 /nobreak >nul 2>&1', { encoding: 'utf-8', stdio: 'ignore' });
      } else {
        execSync('sleep 2', { encoding: 'utf-8', stdio: 'ignore' });
      }
    } catch (error) {
      // Ignorar erros do timeout
    }

    // Depois, limpar diretórios temporários
    console.log('\n[clean-ports] Limpando cache do Next.js...\n');
    cleanNextDirectory();

    // Limpar cache do node_modules
    cleanNodeModulesCache();

    // Limpar diretórios temporários do Playwright
    cleanPlaywrightDirectories();

  console.log('\n[clean-ports] Limpeza concluída!');
  // Script termina com sucesso - garantir saída explícita
  process.exit(0);
  } catch (error) {
    // Capturar qualquer erro não esperado
    console.error('[clean-ports] Erro inesperado durante a limpeza:', error.message);
    // Mesmo com erro, retornar código 0 para não interromper o fluxo do npm
    // (a limpeza é opcional, não deve bloquear os testes)
    process.exit(0);
  }
}

// Executar função principal
main();

