/**
 * Script para atualizar permissões dos roles no banco de dados
 * 
 * Uso:
 *   npx ts-node scripts/update-permissions.ts
 *   ou
 *   npm run update:permissions (se configurado no package.json)
 */

import { PrismaClient, RoleName } from '@prisma/client';
import { DEFAULT_ROLE_PERMISSIONS } from '../src/auth/permissions';

const prisma = new PrismaClient();

async function updatePermissions() {
  console.log('🔄 Atualizando permissões dos roles...\n');

  const roles = [
    RoleName.ADMIN,
    RoleName.ATENDENTE,
    RoleName.PRODUÇÃO,
    RoleName.CAIXA,
  ];

  for (const roleName of roles) {
    try {
      const permissions = DEFAULT_ROLE_PERMISSIONS[roleName];
      
      await prisma.role.update({
        where: { roleName },
        data: {
          rolePermissions: permissions as any,
        },
      });

      console.log(`✅ Permissões do role ${roleName} atualizadas:`);
      console.log(`   - Usuários: ${permissions.users.view ? 'Acesso permitido' : 'Acesso negado'}`);
      console.log(`   - Dashboard: ${permissions.dashboard.view ? 'Acesso permitido' : 'Acesso negado'}`);
      console.log(`   - Perfil: ${permissions.profile.view ? 'Acesso permitido' : 'Acesso negado'}`);
      console.log(`   - Auditoria: ${permissions.audit.view ? 'Acesso permitido' : 'Acesso negado'}`);
      console.log('');
    } catch (error) {
      console.error(`❌ Erro ao atualizar permissões do role ${roleName}:`, error);
    }
  }

  console.log('🎉 Atualização de permissões concluída!');
}

updatePermissions()
  .catch((e) => {
    console.error('❌ Erro durante a atualização:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

