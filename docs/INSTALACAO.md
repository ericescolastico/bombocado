# 🚀 Guia de Instalação - Sistema Bombocado

## 📋 Pré-requisitos

Você precisa ter instalado:
- ✅ Node.js v22 ou superior
- ✅ npm v11 ou superior
- ✅ Git
- ⚠️ PostgreSQL (ainda não instalado)

## ⚠️ Instalar PostgreSQL

### Windows
1. Baixe o instalador em: https://www.postgresql.org/download/windows/
2. Execute o instalador
3. Configure a senha do usuário postgres (use: `postgres`)
4. Adicione PostgreSQL ao PATH durante a instalação

### Verificar instalação
```bash
psql --version
```

## 🔧 Configuração do Projeto

### 1. Backend

```bash
cd backend
```

#### Criar arquivo .env
Copie o arquivo `.env.example` para `.env` e ajuste as configurações:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bombocado?schema=public"
JWT_SECRET="seu-secret-jwt-aqui"
PORT=3000
```

#### Criar banco de dados
```bash
# Conecte ao PostgreSQL
psql -U postgres

# Crie o banco de dados
CREATE DATABASE bombocado;

# Saia do psql
\q
```

#### Executar migrações
```bash
npx prisma migrate dev --name init
```

#### Gerar Prisma Client
```bash
npx prisma generate
```

#### Iniciar servidor backend
```bash
npm run start:dev
```

O backend estará rodando em: `http://localhost:3000`

### 2. Frontend

```bash
cd frontend
```

#### Iniciar servidor frontend
```bash
npm run dev
```

O frontend estará rodando em: `http://localhost:3001`

## 📦 Estrutura do Projeto

```
bombocado/
├── backend/              # API NestJS
│   ├── src/
│   │   ├── prisma/       # Serviço Prisma
│   │   ├── auth/         # Autenticação (a criar)
│   │   ├── users/         # Módulo de usuários (a criar)
│   │   ├── consumers/     # Módulo de clientes (a criar)
│   │   ├── orders/        # Módulo de pedidos (a criar)
│   │   ├── products/      # Módulo de produtos (a criar)
│   │   └── main.ts        # Entry point
│   ├── prisma/
│   │   └── schema.prisma  # Schema do banco de dados
│   └── package.json
├── frontend/             # Next.js App
│   ├── src/
│   │   └── app/
│   │       ├── layout.tsx
│   │       ├── page.tsx
│   │       └── globals.css
│   └── package.json
├── database/             # Scripts SQL adicionais
├── docs/                 # Documentação
└── README.md
```

## 🗄️ Modelos do Banco de Dados

### Users (Usuários)
- ✅ Autenticação e autorização
- ✅ Múltiplos roles (Admin, Atendente, Produção, Caixa)
- ✅ Status de usuário (Online, Offline, Ausente)

### Consumers (Clientes)
- ✅ Cadastro completo de clientes
- ✅ Histórico de pedidos
- ✅ Documentação (CPF, CNPJ, RG)

### Orders (Pedidos)
- ✅ Criação e gerenciamento de pedidos
- ✅ Status de pedido (Pendente → Produção → Pronto → Entregue)
- ✅ Métodos de pagamento (Dinheiro, Cartões, PIX)
- ✅ Agendamento de pedidos

### Products (Produtos)
- ✅ Cadastro de produtos
- ✅ Controle de estoque
- ✅ Código de barras
- ✅ Categorias

## 🎯 Próximos Passos

1. **Instalar PostgreSQL** (se ainda não instalado)
2. **Configurar banco de dados** (criar database e executar migrações)
3. **Criar módulos de autenticação** (JWT, Guards, DTOs)
4. **Implementar módulos principais**:
   - Auth (Login, Registro, Recuperação de senha)
   - Users (CRUD de usuários)
   - Consumers (CRUD de clientes)
   - Orders (Gestão de pedidos)
   - Products (Gestão de produtos)
   - Dashboard (KPIs e relatórios)
5. **Configurar integrações externas**:
   - WhatsApp Business API
   - API NFC-e
   - API PIX

## 🔐 Segurança

- ✅ JWT para autenticação
- ✅ bcrypt para hash de senhas
- ✅ CORS configurado
- ✅ Validação de dados com DTOs

## 📝 Comandos Úteis

```bash
# Backend
cd backend
npm run start:dev      # Desenvolvimento
npm run build          # Build produção
npm run start:prod     # Produção

# Prisma
npx prisma migrate dev           # Criar migração
npx prisma generate              # Gerar Prisma Client
npx prisma studio                 # Interface visual do banco

# Frontend
cd frontend
npm run dev          # Desenvolvimento
npm run build        # Build produção
npm run start        # Produção
npm run lint         # Linter
```

## 🐛 Troubleshooting

### Erro: "psql não é reconhecido"
- PostgreSQL não está instalado ou não está no PATH
- Instale PostgreSQL e reinicie o terminal

### Erro: "Database não existe"
- Execute: `CREATE DATABASE bombocado;` no psql

### Erro: "Port 3000 already in use"
- Mude a porta no arquivo `.env` do backend

## ✅ Status Atual

- ✅ Estrutura do projeto criada
- ✅ Backend (NestJS) configurado
- ✅ Frontend (Next.js) configurado
- ✅ Schema do banco de dados criado
- ⚠️ PostgreSQL precisa ser instalado
- ⏳ Migrations precisam ser executadas
- ⏳ Módulos de negócio precisam ser implementados

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação ou entre em contato com o time de desenvolvimento.

