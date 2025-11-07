import { PrismaClient, RoleName, ConversationStatus } from '@prisma/client';
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

  // Criar conversas de exemplo para o Inbox
  console.log('💬 Criando conversas e mensagens de exemplo...');
  
  const conversation1 = await prisma.conversation.create({
    data: {
      title: 'Cliente João Silva',
      contactName: 'João Silva',
      status: ConversationStatus.AGUARDANDO,
      channel: 'local',
      lastMessageAt: new Date(),
      messages: {
        create: [
          {
            direction: 'IN',
            body: 'Olá! Gostaria de fazer um pedido de bolo para aniversário.',
          },
          {
            direction: 'OUT',
            body: 'Olá João! Claro, ficamos felizes em ajudar. Qual a data do aniversário?',
          },
        ],
      },
    },
  });

  const conversation2 = await prisma.conversation.create({
    data: {
      title: 'Cliente Maria Santos',
      contactName: 'Maria Santos',
      status: ConversationStatus.AGUARDANDO,
      channel: 'local',
      lastMessageAt: new Date(Date.now() - 3600000), // 1 hora atrás
      messages: {
        create: [
          {
            direction: 'IN',
            body: 'Vocês fazem doces personalizados?',
          },
        ],
      },
    },
  });

  console.log('✅ 2 conversas criadas com 3 mensagens no total');

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
