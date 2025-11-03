# 🟢 Sistema de Presença em Tempo Real

Este documento descreve o sistema de presença online/offline de usuários implementado com **WebSocket (Socket.IO) + Redis** no projeto Bombocado.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Configuração](#configuração)
- [Backend](#backend)
- [Frontend](#frontend)
- [Como Usar](#como-usar)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Testes](#testes)
- [Troubleshooting](#troubleshooting)

## 🎯 Visão Geral

O sistema de presença permite exibir o status **online/offline** de múltiplos usuários em tempo real, com:

- ✅ **Backend**: NestJS + Socket.IO com adapter Redis
- ✅ **Frontend**: React com socket.io-client
- ✅ **Anti-multi-abas**: apenas uma aba envia heartbeat
- ✅ **Escala horizontal**: suporta múltiplas instâncias do backend via Redis
- ✅ **TTL automático**: usuários ficam offline após 90s sem heartbeat

## 🏗️ Arquitetura

### Fonte de Verdade

A fonte de verdade para "online" é o **Redis**, usando chaves com TTL:

- **Chave**: `presence:user:{userId}`
- **Valor**: timestamp ISO (lastSeen)
- **TTL**: 90 segundos

**"Online" = chave existe e não expirou**

### Eventos WebSocket

#### Cliente → Servidor

- `presence:heartbeat` - Heartbeat enviado pelo líder (sem payload)

#### Servidor → Cliente

- `presence:update` - Atualização de presença de um usuário
  ```typescript
  { userId: string, online: boolean, lastSeen: string }
  ```

- `presence:snapshot` - Estado inicial ao conectar
  ```typescript
  { entries: Array<{ userId, online, lastSeen }> }
  ```

### Heartbeat

- **Intervalo**: 25 segundos (enviado pelo líder)
- **TTL por batida**: 90 segundos
- **Rate limit**: máximo 1 heartbeat a cada 10s por socket
- **Líder único**: apenas uma aba por usuário envia heartbeats

### Eleição de Líder (Multi-abas)

O sistema usa **BroadcastChannel** (quando disponível) ou **localStorage** (fallback) para eleger um líder entre múltiplas abas:

1. Cada aba anuncia "hello"
2. Se ninguém responder em ~500ms, assume liderança
3. Líder envia `"i-am-leader"` periodicamente
4. Se líder fecha, outras abas detectam e um assume liderança

## ⚙️ Configuração

### Pré-requisitos

- ✅ Redis rodando (local ou serviço gerenciado)
- ✅ Backend NestJS configurado
- ✅ Frontend Next.js configurado

### Redis

O Redis deve estar acessível na porta configurada (padrão: `localhost:6379`).

**Instalação local (Windows):**

1. Baixe o Redis para Windows: https://github.com/microsoftarchive/redis/releases
2. Ou use WSL2: `sudo apt install redis-server`
3. Inicie: `redis-server`

**Ou use um serviço gerenciado:**
- Redis Cloud
- AWS ElastiCache
- Azure Cache for Redis

## 🔧 Backend

### Estrutura de Arquivos

```
backend/src/
├── infra/redis/
│   ├── redis.module.ts          # Módulo Redis global
│   ├── redis.service.ts          # Serviço Redis (singleton)
│   └── redis-io.adapter.ts       # Adapter Socket.IO + Redis
└── presence/
    ├── presence.module.ts        # Módulo de presença
    ├── presence.gateway.ts       # Gateway Socket.IO (/presence)
    ├── presence.service.ts       # Operações Redis
    ├── presence.guard.ts         # Guard JWT para WebSocket
    ├── presence.controller.ts    # REST auxiliar
    ├── presence.events.ts        # Constantes de eventos
    └── presence.types.ts         # Tipos TypeScript
```

### Configuração no NestJS

O adapter Redis é configurado automaticamente no `PresenceGateway` via `afterInit()`:

```typescript
afterInit(server: Server) {
  const { pubClient, subClient } = this.redisService.getPubSubClients();
  server.adapter(createAdapter(pubClient, subClient));
}
```

### Autenticação

O gateway valida o JWT no handshake:

- **Query**: `?token=...`
- **Auth header**: `auth: { token: ... }`
- **Authorization header**: `Authorization: Bearer ...`

Se inválido, o cliente é desconectado.

### REST Endpoints

#### `GET /presence?ids=1,2,3`

Retorna status de presença de múltiplos usuários.

**Requisição:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/presence?ids=1,2,3"
```

**Resposta:**
```json
{
  "entries": [
    { "userId": "1", "online": true, "lastSeen": "2024-01-15T10:30:00.000Z" },
    { "userId": "2", "online": false, "lastSeen": "" },
    { "userId": "3", "online": true, "lastSeen": "2024-01-15T10:29:45.000Z" }
  ]
}
```

#### `GET /presence/health/redis`

Healthcheck do Redis.

**Resposta:**
```json
{
  "status": "ok",
  "redis": "connected",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🖥️ Frontend

### Estrutura de Arquivos

```
frontend/src/
├── presence/
│   ├── presenceClient.ts         # Cliente Socket.IO
│   ├── presenceStore.ts          # Store Zustand
│   ├── leaderElection.ts         # Eleição de líder
│   ├── usePresence.ts            # Hook React
│   └── presence.events.ts        # Constantes de eventos
└── components/
    └── StatusDot.tsx             # Componente visual
```

### Cliente Socket.IO

O cliente conecta automaticamente quando o usuário está autenticado:

```typescript
const client = new PresenceClient(
  () => console.log('Connected'),
  () => console.log('Disconnected'),
  (error) => console.error('Error:', error),
);

client.connect(token);
```

### Store Zustand

O store mantém o estado de presença em memória:

```typescript
const store = usePresenceStore();

// Aplicar snapshot
store.applySnapshot(entries);

// Aplicar update
store.applyUpdate(userId, { online: true, lastSeen: '...' });

// Consultar
const isOnline = store.isOnline(userId);
const lastSeen = store.getLastSeen(userId);
```

### Hook `usePresence`

Hook React para consumir presença:

```typescript
const presence = usePresence(['userId1', 'userId2']);

// Verificar status
const isOnline = presence.isOnline('userId1');
const lastSeen = presence.getLastSeen('userId1');
const entry = presence.get('userId1');
```

### Componente `StatusDot`

Componente visual para exibir status:

```tsx
<StatusDot userId="123" size="md" showTooltip={true} />
```

**Props:**
- `userId`: ID do usuário
- `size`: `'sm' | 'md' | 'lg'` (padrão: `'md'`)
- `showTooltip`: mostrar tooltip com lastSeen (padrão: `true`)

## 💻 Como Usar

### 1. Configurar Variáveis de Ambiente

**Backend** (`backend/.env` ou raiz `.env`):

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS=false
JWT_SECRET=your-secret
CORS_ORIGIN=http://localhost:3001
```

**Frontend** (`frontend/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 2. Iniciar Redis

```bash
redis-server
```

### 3. Iniciar Backend

```bash
cd backend
npm install
npm run start:dev
```

### 4. Iniciar Frontend

```bash
cd frontend
npm install
npm run dev
```

### 5. Usar no Frontend

#### Exemplo básico:

```tsx
import { StatusDot } from '@/components/StatusDot';

function UserList() {
  return (
    <div>
      <div className="flex items-center gap-2">
        <StatusDot userId="123" />
        <span>Usuário 123</span>
      </div>
    </div>
  );
}
```

#### Exemplo com hook:

```tsx
import { usePresence } from '@/presence/usePresence';

function UserCard({ userId }) {
  const presence = usePresence([userId]);
  const isOnline = presence.isOnline(userId);
  
  return (
    <div>
      <StatusDot userId={userId} />
      <span>{isOnline ? 'Online' : 'Offline'}</span>
    </div>
  );
}
```

## 🔐 Variáveis de Ambiente

### Backend

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `REDIS_HOST` | `localhost` | Host do Redis |
| `REDIS_PORT` | `6379` | Porta do Redis |
| `REDIS_PASSWORD` | - | Senha do Redis (opcional) |
| `REDIS_TLS` | `false` | Usar TLS para Redis |
| `JWT_SECRET` | - | Secret para validação JWT |
| `CORS_ORIGIN` | `http://localhost:3001` | Origem permitida no CORS |

### Frontend

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | URL da API backend |

## 🧪 Testes

### Backend

#### Testes Unitários (Service)

```bash
cd backend
npm test -- presence.service.spec.ts
```

#### Testes de Integração (Gateway)

```bash
npm test -- presence.gateway.spec.ts
```

### Frontend

Testes manuais:

1. Abrir duas abas logadas com o mesmo usuário
2. Verificar logs: apenas uma aba deve enviar heartbeats
3. Fechar a aba líder: outra deve assumir liderança
4. Verificar status online/offline em tempo real

## 🔍 Troubleshooting

### Erro: "Cannot connect to Redis"

**Causa**: Redis não está rodando ou host/porta incorretos.

**Solução**:
```bash
# Verificar se Redis está rodando
redis-cli ping  # Deve responder "PONG"

# Verificar variáveis de ambiente
echo $REDIS_HOST
echo $REDIS_PORT
```

### Erro: "Connection rejected: invalid token"

**Causa**: JWT inválido ou expirado.

**Solução**:
- Verificar se o token está sendo enviado corretamente
- Verificar `JWT_SECRET` no backend
- Fazer login novamente

### Múltiplas abas enviando heartbeats

**Causa**: Eleição de líder não está funcionando.

**Solução**:
- Verificar suporte a BroadcastChannel (Chrome/Firefox modernos)
- Verificar localStorage (navegador não bloqueia)
- Verificar logs no console do navegador

### Status não atualiza em tempo real

**Causa**: Cliente Socket.IO não está conectado.

**Solução**:
- Verificar conexão WebSocket nos DevTools (Network > WS)
- Verificar logs no console
- Verificar se o usuário está autenticado

### Usuário fica online mesmo após desconectar

**Causa**: TTL do Redis não está expirando (90s).

**Solução**:
- Verificar se o TTL está configurado corretamente
- Aguardar 90s após desconectar
- Verificar chaves no Redis: `redis-cli KEYS "presence:user:*"`

## 📊 Parâmetros Técnicos

| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| `HEARTBEAT_INTERVAL_MS` | `25000` | Intervalo entre heartbeats (líder) |
| `REDIS_TTL_SECONDS` | `90` | TTL da chave de presença |
| `RATE_LIMIT_MS` | `10000` | Rate limit de heartbeat (server) |
| `LEADER_HEARTBEAT_INTERVAL_MS` | `5000` | Intervalo de heartbeat do líder |
| `LEADER_TIMEOUT_MS` | `8000` | Timeout do líder (localStorage) |

## 🚀 Escala Horizontal

O sistema suporta múltiplas instâncias do backend via Redis Adapter:

1. Todas as instâncias conectam ao mesmo Redis
2. Eventos são roteados via Redis pub/sub
3. Clientes podem conectar a qualquer instância
4. Presença é compartilhada entre todas as instâncias

## 📝 Notas de Implementação

- ✅ Não salve booleano "online" no Postgres; use computação por janela via Redis + TTL
- ✅ JWT no handshake: enviar como `auth: { token }` no socket.io-client
- ✅ Logs do gateway incluem `userId`, `socket.id`, evento e ação
- ✅ Rate limiting server-side previne flood de heartbeats
- ✅ Desconexão não marca offline imediato; TTL cuida disso

## 🔗 Referências

- [Socket.IO Redis Adapter](https://socket.io/docs/v4/redis-adapter/)
- [NestJS WebSockets](https://docs.nestjs.com/websockets/gateways)
- [Zustand](https://github.com/pmndrs/zustand)
- [BroadcastChannel API](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel)

---

**Última atualização**: 2024-01-15

