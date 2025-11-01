# 🍩 Sistema de Gestão Bombocado

Sistema completo de gestão para padaria/doceria com gerenciamento de pedidos, estoque, clientes, NFC-e e muito mais.

## 📋 Funcionalidades Principais

### Gestão de Usuários
- Login e autenticação
- Controle de acesso por tipo de funcionário (admin, atendente, produção, caixa)
- Logs de ações por usuário

### Nota Fiscal Eletrônica (NFC-e)
- Certificação eletrônica
- Geração de NFC-e
- Cancelamento de nota
- Carta de Correção Eletrônica (CC-e)
- Envio automatizado via Email e WhatsApp
- Integração com impressora de cupom fiscal

### Gestão de Clientes
- Banco de dados de clientes
- Cadastro e edição
- Histórico de pedidos
- Exportação de dados
- Disparo em massa
- Crédito de cliente

### Atendimento
- Fluxos automatizados via WhatsApp
- Pagamento automático com PIX
- Fila de atendimento
- Atendentes múltiplos com atribuição
- Relatórios de atendimento

### Pedidos
- Agendamento automático e manual
- Criação, edição e cancelamento de pedidos
- Meios de pagamento (Dinheiro, Cartões, PIX)
- Relatórios de vendas

### Produção
- Distribuição de pedidos para setores produtivos
- Separação por tipo e horário
- Fila de pedidos agendados
- Confirmação de feitos/não feitos
- Status do pedido (Feito/Entregue)

### Caixa e Balanço
- Balanço diário
- Relatórios de faturamento
- Registro de retiradas/sangrias

### Estoque
- Estoque de produtos e insumos
- Entrada por código de barras
- Histórico de compras
- Alerta de estoque mínimo

### Painel Dashboard
- KPIs: ticket médio, faturamento diário, produtos mais vendidos
- Quadro de avisos interno
- Webhook para pedidos e movimentações

## 🛠️ Tecnologias

### Backend
- **NestJS** - Framework Node.js
- **TypeScript** - Linguagem principal
- **PostgreSQL** - Banco de dados relacional
- **Prisma** - ORM
- **JWT** - Autenticação
- **bcrypt** - Hash de senhas

### Frontend
- **Next.js 14** - Framework React
- **TypeScript** - Linguagem principal
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes UI
- **React Query** - Gerenciamento de estado

### Integrações
- **WhatsApp Business API** - Atendimento automatizado
- **API NFC-e** - Emissão de notas fiscais
- **API PIX** - Pagamentos automatizados

## 📦 Instalação Completa

⚠️ **Importante**: Você precisa ter PostgreSQL instalado antes de começar!

### 1. Instalar PostgreSQL

- **Windows**: Baixe em https://www.postgresql.org/download/windows/
- Configure senha como: `postgres`

### 2. Configurar Backend

```bash
# Entre na pasta do backend
cd backend

# Instale as dependências
npm install

# Crie o arquivo .env (copie de .env.example)
# Ajuste as credenciais do banco de dados

# Crie o banco de dados no PostgreSQL
# psql -U postgres
# CREATE DATABASE bombocado;

# Execute as migrações
npx prisma migrate dev --name init

# Gere o Prisma Client
npx prisma generate

# Inicie o servidor backend
npm run start:dev
```

O backend rodará em `http://localhost:3000`

### 3. Configurar Frontend

```bash
# Entre na pasta do frontend
cd frontend

# Instale as dependências
npm install

# Inicie o servidor frontend
npm run dev
```

O frontend rodará em `http://localhost:3001`

## 🚀 Como Iniciar o Desenvolvimento

### 1. Iniciar o Backend
```bash
cd backend
npm run start:dev
```
O backend estará rodando em: `http://localhost:3000`

### 2. Iniciar o Frontend
```bash
cd frontend
npm run dev
```
O frontend estará rodando em: `http://localhost:3001`

### 3. Verificar Banco de Dados
```bash
cd backend

```
Interface visual do banco de dados em: `http://localhost:5555`

## 📝 Estrutura Atual do Projeto

```
bombocado/
├── backend/              # API NestJS
│   ├── src/
│   │   ├── auth/         # Módulo de autenticação (a implementar)
│   │   ├── users/        # Módulo de usuários (a implementar)
│   │   ├── consumers/    # Módulo de clientes (a implementar)
│   │   ├── orders/       # Módulo de pedidos (a implementar)
│   │   ├── products/     # Módulo de produtos (a implementar)
│   │   ├── dashboard/    # Módulo de dashboard (a implementar)
│   │   ├── prisma/       # Serviço Prisma
│   │   ├── app.module.ts # Módulo principal
│   │   └── main.ts       # Entry point
│   ├── prisma/
│   │   ├── schema.prisma # Schema do banco de dados
│   │   └── migrations/   # Migrações do banco
│   └── package.json
├── frontend/             # Next.js App
│   ├── src/
│   │   ├── app/          # App Router do Next.js
│   │   ├── components/   # Componentes React (a criar)
│   │   ├── lib/          # Utilitários e configurações
│   │   ├── hooks/        # Custom hooks React
│   │   └── types/        # Definições TypeScript
│   └── package.json
├── docs/                 # Documentação
└── README.md
```

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env` na pasta backend com:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/bombocado"
JWT_SECRET="seu-secret-jwt"
NFC_E_API_KEY="sua-chave-api"
WHATSAPP_API_KEY="sua-chave-whatsapp"
```

## ✅ Status Atual do Projeto

- ✅ **Documentação** analisada e requisitos mapeados
- ✅ **Estrutura** do projeto criada e organizada (Backend + Frontend)
- ✅ **Backend** configurado e funcionando (NestJS + TypeScript + Prisma)
- ✅ **Frontend** configurado e funcionando (Next.js + TypeScript + Tailwind)
- ✅ **PostgreSQL** instalado e funcionando
- ✅ **Banco de dados** criado e migrations executadas
- ✅ **Prisma Client** gerado e funcionando
- ✅ **Autenticação** backend implementada (JWT + Guards)
- ✅ **Sistema de Usuários** backend implementado (CRUD completo)
- ✅ **Frontend** implementado com páginas de Login e Perfil
- ✅ **Componentes UI** reutilizáveis criados
- ✅ **Proteção de Rotas** implementada
- ⏳ **Módulos de negócio** prontos para implementação

## 🎯 Próximos Passos

1. ✅ **🔐 Autenticação Implementada**
   - Módulo de Auth com JWT criado
   - Login/logout funcionando
   - Guards de proteção configurados

2. ✅ **💻 Frontend Implementado**
   - Página de Login funcional
   - Página de Perfil com 3 abas
   - Componentes reutilizáveis criados
   - Proteção de rotas implementada

3. ⏳ **👥 Criar Módulos de Negócio**
   - Módulo de Clientes (CRUD)
   - Módulo de Produtos (CRUD)
   - Módulo de Pedidos (CRUD)
   - Módulo de Atendimento

4. ⏳ **📊 Dashboard e Relatórios**
   - KPIs principais
   - Relatórios de vendas
   - Painel administrativo

5. ⏳ **🔗 Integrações Externas**
   - WhatsApp Business API
   - API NFC-e
   - API PIX

## 📱 Telas Implementadas

### Frontend
- ✅ **Login**: Página de autenticação com validação
- ✅ **Perfil**: Dashboard do usuário com:
  - Aba de Informações (edição de dados)
  - Aba de Estatísticas
  - Aba de Log de Atividades
- ✅ **Home**: Página inicial com redirecionamento

## 📄 Licença

Este projeto é proprietário e confidencial.

