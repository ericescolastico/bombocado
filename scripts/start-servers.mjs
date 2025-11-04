#!/usr/bin/env node

/**
 * Script para iniciar servidores necessários para testes E2E
 * - Verifica/inicia Docker Compose (Postgres, Redis)
 * - Inicia backend em modo dev
 * - Inicia frontend em modo dev
 * - Aguarda todos estarem prontos
 */

import { spawn } from 'child_process';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function checkDockerCompose() {
  try {
    await execAsync('docker compose ps');
    return true;
  } catch (error) {
    return false;
  }
}

async function startDockerCompose() {
  log('🐳 Verificando Docker Compose...', colors.blue);
  
  try {
    const { stdout } = await execAsync('docker compose ps --format json', { cwd: projectRoot });
    const services = stdout.trim().split('\n').filter(Boolean);
    
    let postgresRunning = false;
    let redisRunning = false;
    
    for (const service of services) {
      try {
        const parsed = JSON.parse(service);
        if (parsed.Service === 'postgres' && parsed.State === 'running') {
          postgresRunning = true;
        }
        if (parsed.Service === 'redis' && parsed.State === 'running') {
          redisRunning = true;
        }
      } catch (e) {
        // Ignorar linhas que não são JSON
      }
    }
    
    if (!postgresRunning || !redisRunning) {
      log('📦 Iniciando Docker Compose (Postgres e Redis)...', colors.yellow);
      const dockerCompose = spawn('docker', ['compose', 'up', '-d', 'postgres', 'redis'], {
        cwd: projectRoot,
        stdio: 'inherit',
        shell: true,
      });
      
      await new Promise((resolve, reject) => {
        dockerCompose.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Docker Compose exited with code ${code}`));
          }
        });
      });
      
      // Aguardar serviços ficarem saudáveis
      log('⏳ Aguardando serviços ficarem saudáveis...', colors.yellow);
      await new Promise((resolve) => setTimeout(resolve, 10000));
    } else {
      log('✅ Docker Compose já está rodando', colors.green);
    }
  } catch (error) {
    log(`⚠️  Erro ao verificar Docker Compose: ${error.message}`, colors.yellow);
    log('   Tentando iniciar Docker Compose...', colors.yellow);
    
    const dockerCompose = spawn('docker', ['compose', 'up', '-d', 'postgres', 'redis'], {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: true,
    });
    
    await new Promise((resolve, reject) => {
      dockerCompose.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Docker Compose exited with code ${code}`));
        }
      });
    });
    
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }
}

async function waitForServer(url, name, timeout = 120000) {
  log(`⏳ Aguardando ${name} em ${url}...`, colors.yellow);
  
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status < 500) {
        log(`✅ ${name} está pronto!`, colors.green);
        return true;
      }
    } catch (error) {
      // Servidor ainda não está pronto
    }
    
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  
  throw new Error(`Timeout aguardando ${name} em ${url}`);
}

function startBackend() {
  log('🚀 Iniciando backend...', colors.blue);
  
  const backend = spawn('npm', ['run', 'start:dev'], {
    cwd: join(projectRoot, 'backend'),
    stdio: 'pipe',
    shell: true,
  });
  
  backend.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Nest application successfully started')) {
      log('✅ Backend iniciado!', colors.green);
    }
  });
  
  backend.stderr.on('data', (data) => {
    const output = data.toString();
    if (!output.includes('DeprecationWarning')) {
      process.stderr.write(data);
    }
  });
  
  return backend;
}

function startFrontend() {
  log('🚀 Iniciando frontend...', colors.blue);
  
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: join(projectRoot, 'frontend'),
    stdio: 'pipe',
    shell: true,
    env: {
      ...process.env,
      NEXT_PUBLIC_API_URL: 'http://localhost:3000',
    },
  });
  
  frontend.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Ready') || output.includes('Local:')) {
      log('✅ Frontend iniciado!', colors.green);
    }
  });
  
  frontend.stderr.on('data', (data) => {
    process.stderr.write(data);
  });
  
  return frontend;
}

async function main() {
  log('🎬 Iniciando setup de servidores para testes E2E...', colors.blue);
  
  try {
    // 1. Iniciar Docker Compose
    await startDockerCompose();
    
    // 2. Iniciar backend
    const backend = startBackend();
    await waitForServer('http://localhost:3000', 'Backend', 120000);
    
    // 3. Iniciar frontend
    const frontend = startFrontend();
    await waitForServer('http://localhost:3001', 'Frontend', 120000);
    
    log('\n✅ Todos os servidores estão rodando!', colors.green);
    log('📝 Pressione Ctrl+C para encerrar todos os servidores\n', colors.yellow);
    
    // Manter processos rodando
    process.on('SIGINT', () => {
      log('\n🛑 Encerrando servidores...', colors.yellow);
      backend.kill();
      frontend.kill();
      process.exit(0);
    });
    
    // Aguardar indefinidamente
    await new Promise(() => {});
  } catch (error) {
    log(`❌ Erro: ${error.message}`, colors.red);
    process.exit(1);
  }
}

main();
