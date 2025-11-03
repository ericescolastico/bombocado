# 🚀 Início Rápido - Sistema Bombocado

## ⚡ Execução Rápida

### 1️⃣ Pré-requisitos

Certifique-se de ter instalado:
- ✅ **Node.js v22+** 
- ✅ **PostgreSQL** (banco de dados)
- ✅ **Redis** (fila de eventos) - **OPCIONAL** (sistema funciona sem ele)

### 2️⃣ Instalar PostgreSQL

**Windows:**
1. Baixe em: https://www.postgresql.org/download/windows/
2. Execute o instalador
3. Configure senha: `postgres` (ou use a sua preferência)

**Verificar instalação:**
```bash
psql --version
```

**Criar banco de dados:**
```bash
psql -U postgres
CREATE DATABASE bombocado;
\q
```

### 3️⃣ Instalar Redis (Opcional)

O sistema **funciona sem Redis**, mas é recomendado para melhor desempenho.

**Opção A - Docker (Recomendado):**
```bash
docker run -d -p 6379:6379 redis:latest
```

**Opção B - Windows:**
Baixe em: https://redis.io/download

> 💡 **Nota**: Se Redis não estiver instalado, o sistema gravará os logs de auditoria direto no PostgreSQL.

### 4️⃣ Configurar Backend

**Criar arquivo `.env` em `backend/.env`:**

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bombocado?schema=public"
JWT_SECRET="bombocado-super-secret-jwt-key-2024-production-change-me"
REDIS_HOST="localhost"
REDIS_PORT="6379"
BCRYPT_ROUNDS="12"
PORT="3000"
CORS_ORIGIN="http://localhost:3001"
```

**Executar comandos:**

```bash
cd backend
npm install
npx prisma generate
npm run start:dev
```

✅ Backend rodando em: `http://localhost:3000`

### 5️⃣ Configurar Frontend

**Criar arquivo `.env.local` em `frontend/.env.local`:**

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Executar comandos:**

```bash
cd frontend
npm install
npm run dev
```

✅ Frontend rodando em: `http://localhost:3001`

---

## 🎯 Pronto! Sistema Funcionando

### Acessar o Sistema

1. Abra: `http://localhost:3001`
2. Você será redirecionado para: `http://localhost:3001/login`
3. Fazer login com suas credenciais

### Páginas Disponíveis

- ✅ **Login**: `http://localhost:3001/login`
- ✅ **Home**: `http://localhost:3001` (redireciona para /perfil)
- ✅ **Perfil**: `http://localhost:3001/perfil`
  - Aba: Editar Informações
  - Aba: Log de Atividades
  - Aba: Estatísticas

### APIs Disponíveis

Backend API em: `http://localhost:3000`

**Endpoints:**
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout  
- `POST /auth/register` - Registro
- `GET /audit/:userId` - Logs de atividades
- `GET /users` - Listar usuários
- `PATCH /users/profile` - Atualizar perfil

---

## 🛠️ Comandos Úteis

### Backend

```bash
cd backend

# Desenvolvimento
npm run start:dev

# Build produção
npm run build

# Executar produção
npm run start:prod

# Prisma Studio (Interface visual do banco)
npx prisma studio

# Criar nova migração
npx prisma migrate dev --name nome_migracao

# Gerar Prisma Client
npx prisma generate
```

### Frontend

```bash
cd frontend

# Desenvolvimento
npm run dev

# Build produção
npm run build

# Executar produção
npm run start

# Linter
npm run lint
```

---

## 🔧 Troubleshooting

### Erro: "psql não é reconhecido"
- PostgreSQL não está instalado ou não está no PATH
- Instale PostgreSQL e reinicie o terminal

### Erro: "Database não existe"
- Execute: `CREATE DATABASE bombocado;` no psql

### Erro: "Port 3000 already in use"
- Mude a porta no arquivo `.env` do backend
- Ou mate o processo usando a porta 3000

### Erro: "Cannot connect to Redis"
- **NÃO É PROBLEMA**: O sistema funciona sem Redis
- Os logs de auditoria serão gravados direto no PostgreSQL
- Para melhor performance, instale Redis

### Erro: "Prisma Client not generated"
```bash
cd backend
npx prisma generate
```

### Erro: "Migrate database"
```bash
cd backend
npx prisma migrate dev
```

---

## 📊 Verificar Status

### Backend OK?
Acesse: `http://localhost:3000`

### Frontend OK?
Acesse: `http://localhost:3001`

### Prisma Studio (Banco de Dados)?
```bash
cd backend
npx prisma studio
```
Acesse: `http://localhost:5555`

---

## ✅ Checklist de Instalação

- [ ] PostgreSQL instalado
- [ ] Redis instalado (opcional)
- [ ] Banco de dados `bombocado` criado
- [ ] Arquivo `backend/.env` criado com as variáveis
- [ ] Arquivo `frontend/.env.local` criado
- [ ] `npm install` executado no backend
- [ ] `npm install` executado no frontend
- [ ] `npx prisma generate` executado
- [ ] Backend rodando em `http://localhost:3000`
- [ ] Frontend rodando em `http://localhost:3001`
- [ ] Login funcionando

---

## 📚 Documentação Adicional

- **Guia Completo**: Ver `docs/INSTALACAO.md`
- **Sistema de Auditoria**: Ver `docs/SISTEMA_AUDITORIA.md`
- **README Principal**: Ver `docs/README_ROOT.md`

---

## 🆘 Precisa de Ajuda?

1. Verifique se todos os pré-requisitos estão instalados
2. Confira os arquivos `.env` e `.env.local`
3. Execute os comandos na ordem correta
4. Verifique as portas 3000 e 3001
5. Consulte a seção Troubleshooting acima

**Boa sorte com o desenvolvimento! 🍩✨**
