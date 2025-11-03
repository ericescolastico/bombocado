import { PrismaClient, RoleName } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { DEFAULT_ROLE_PERMISSIONS } from '../src/auth/permissions';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando seed do banco de dados...');

  // Criar roles com permissões
  const roles = [
    RoleName.ADMIN,
    RoleName.ATENDENTE,
    RoleName.PRODUÇÃO,
    RoleName.CAIXA,
  ];

  console.log('📝 Criando roles com permissões...');
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { roleName },
      update: {
        rolePermissions: DEFAULT_ROLE_PERMISSIONS[roleName] as any,
      },
      create: {
        roleName,
        rolePermissions: DEFAULT_ROLE_PERMISSIONS[roleName] as any,
      },
    });
    console.log(`✅ Role ${roleName} criada/atualizada com permissões`);
  }

  // Criar usuário admin
  console.log('👤 Criando usuário admin...');
  const adminRole = await prisma.role.findUnique({
    where: { roleName: RoleName.ADMIN },
  });

  if (adminRole) {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const passwordHash = await bcrypt.hash('ADMIN123', saltRounds);

    const adminUser = await prisma.user.upsert({
      where: { username: 'ADMIN' },
      update: {},
      create: {
        username: 'ADMIN',
        firstName: 'Administrador',
        lastName: 'Sistema',
        email: 'admin@bombocado.com',
        passwordHash,
        roleId: adminRole.roleId,
        statusUser: 'OFFLINE',
        statusAccount: 'ATIVO',
        emailVerified: true,
      },
    });

    console.log('✅ Usuário ADMIN criado com sucesso!');
    console.log('📋 Credenciais:');
    console.log('   Login: ADMIN');
    console.log('   Senha: ADMIN123');
    console.log('   Email: admin@bombocado.com');
  }

  console.log('🎉 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
