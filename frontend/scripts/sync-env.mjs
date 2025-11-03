import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const rootEnvPath = resolve(process.cwd(), '../.env');
const targetPath = resolve(process.cwd(), '.env.local');

try {
  if (!existsSync(rootEnvPath)) {
    console.log('[sync-env] Nenhum .env na raiz encontrado, pulando.');
    process.exit(0);
  }

  const content = readFileSync(rootEnvPath, 'utf8');
  const lines = content.split(/\r?\n/);
  const nextPublic = lines.filter((l) => /^NEXT_PUBLIC_[A-Z0-9_]+=/.test(l));

  const dir = dirname(targetPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const banner = '# Arquivo gerado automaticamente a partir da raiz (.env)\n';
  writeFileSync(targetPath, banner + nextPublic.join('\n') + '\n', 'utf8');
  console.log(`[sync-env] Gerado ${targetPath} com ${nextPublic.length} variáveis.`);
} catch (err) {
  console.error('[sync-env] Falha ao sincronizar env:', err);
  process.exit(0);
}


