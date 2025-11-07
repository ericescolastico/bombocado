import { PrismaClient, RoleName, ConversationStatus, DocumentType } from '@prisma/client';
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

  let adminUser;
  if (adminRole) {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const passwordHash = await bcrypt.hash('ADMIN123', saltRounds);

    adminUser = await prisma.user.upsert({
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

  // Criar consumers (clientes) fictícios
  console.log('👥 Criando 10 clientes fictícios...');
  
  if (!adminUser) {
    adminUser = await prisma.user.findUnique({
      where: { username: 'ADMIN' },
    });
  }

  if (!adminUser) {
    console.log('⚠️  Usuário ADMIN não encontrado. Pulando criação de consumers.');
  } else {
    const consumers = [
      {
        firstName: 'João',
        lastName: 'Silva',
        email: 'joao.silva@email.com',
        profileImage: 'https://i.pravatar.cc/150?img=1',
        address: 'Rua das Flores, 123, Centro',
        zipcode: '12345-678',
        phone: '(11) 98765-4321',
        docNumber: '123.456.789-00',
        docType: DocumentType.CPF,
        consumerNotes: 'Cliente frequente, prefere bolos de chocolate. Sempre pede com antecedência de 3 dias.',
        createdById: adminUser.userId,
      },
      {
        firstName: 'Maria',
        lastName: 'Santos',
        email: 'maria.santos@email.com',
        profileImage: 'https://i.pravatar.cc/150?img=5',
        address: 'Avenida Paulista, 1000, Bela Vista',
        zipcode: '01310-100',
        phone: '(11) 91234-5678',
        docNumber: '987.654.321-00',
        docType: DocumentType.CPF,
        consumerNotes: 'Gosta de doces personalizados para eventos corporativos. Cliente VIP.',
        createdById: adminUser.userId,
      },
      {
        firstName: 'Pedro',
        lastName: 'Oliveira',
        email: 'pedro.oliveira@email.com',
        profileImage: 'https://i.pravatar.cc/150?img=12',
        address: 'Rua Augusta, 456, Consolação',
        zipcode: '01305-000',
        phone: '(11) 99876-5432',
        docNumber: '456.789.123-00',
        docType: DocumentType.CPF,
        consumerNotes: 'Prefere produtos sem açúcar. Alérgico a lactose.',
        createdById: adminUser.userId,
      },
      {
        firstName: 'Ana',
        lastName: 'Costa',
        email: 'ana.costa@email.com',
        profileImage: 'https://i.pravatar.cc/150?img=9',
        address: 'Rua dos Três Irmãos, 789, Vila Progredior',
        zipcode: '05615-200',
        phone: '(11) 97654-3210',
        docNumber: '789.123.456-00',
        docType: DocumentType.CPF,
        consumerNotes: 'Faz pedidos mensais para festas infantis. Sempre paga em dinheiro.',
        createdById: adminUser.userId,
      },
      {
        firstName: 'Carlos',
        lastName: 'Ferreira',
        email: 'carlos.ferreira@email.com',
        profileImage: 'https://i.pravatar.cc/150?img=15',
        address: 'Alameda Santos, 200, Jardins',
        zipcode: '01418-000',
        phone: '(11) 96543-2109',
        docNumber: '12.345.678/0001-90',
        docType: DocumentType.CNPJ,
        consumerNotes: 'Empresa de eventos. Solicita nota fiscal. Pagamento via PIX.',
        createdById: adminUser.userId,
      },
      {
        firstName: 'Juliana',
        lastName: 'Almeida',
        email: 'juliana.almeida@email.com',
        profileImage: 'https://i.pravatar.cc/150?img=20',
        address: 'Rua Haddock Lobo, 500, Cerqueira César',
        zipcode: '01414-000',
        phone: '(11) 95432-1098',
        docNumber: '321.654.987-00',
        docType: DocumentType.CPF,
        consumerNotes: 'Cliente novo. Interessada em bolos veganos e sem glúten.',
        createdById: adminUser.userId,
      },
      {
        firstName: 'Roberto',
        lastName: 'Martins',
        email: 'roberto.martins@email.com',
        profileImage: 'https://i.pravatar.cc/150?img=33',
        address: 'Rua Bela Cintra, 300, Consolação',
        zipcode: '01315-000',
        phone: '(11) 94321-0987',
        docNumber: '654.321.987-00',
        docType: DocumentType.CPF,
        consumerNotes: 'Prefere retirar no balcão. Horário comercial apenas.',
        createdById: adminUser.userId,
      },
      {
        firstName: 'Fernanda',
        lastName: 'Lima',
        email: 'fernanda.lima@email.com',
        profileImage: 'https://i.pravatar.cc/150?img=47',
        address: 'Avenida Brigadeiro Faria Lima, 1500, Itaim Bibi',
        zipcode: '01452-000',
        phone: '(11) 93210-9876',
        docNumber: '987.321.654-00',
        docType: DocumentType.CPF,
        consumerNotes: 'Faz pedidos grandes para aniversários. Solicita entrega em domicílio.',
        createdById: adminUser.userId,
      },
      {
        firstName: 'Rafael',
        lastName: 'Souza',
        email: 'rafael.souza@email.com',
        profileImage: 'https://i.pravatar.cc/150?img=51',
        address: 'Rua dos Pinheiros, 800, Pinheiros',
        zipcode: '05422-000',
        phone: '(11) 92109-8765',
        docNumber: '23.456.789/0001-10',
        docType: DocumentType.CNPJ,
        consumerNotes: 'Restaurante. Pedidos semanais. Negociação de preço por volume.',
        createdById: adminUser.userId,
      },
      {
        firstName: 'Patrícia',
        lastName: 'Rodrigues',
        email: 'patricia.rodrigues@email.com',
        profileImage: 'https://i.pravatar.cc/150?img=68',
        address: 'Rua dos Lírios, 250, Vila Madalena',
        zipcode: '05433-000',
        phone: '(11) 91098-7654',
        docNumber: '147.258.369-00',
        docType: DocumentType.CPF,
        consumerNotes: 'Cliente desde 2020. Sempre satisfeita. Recomenda para amigos.',
        createdById: adminUser.userId,
      },
    ];

    for (const consumerData of consumers) {
      await prisma.consumer.create({
        data: consumerData,
      });
    }

    console.log('✅ 10 clientes criados com sucesso!');
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
