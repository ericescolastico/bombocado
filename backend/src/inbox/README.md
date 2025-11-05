# Módulo Inbox

Módulo responsável por gerenciar conversas e mensagens do sistema.

## Endpoints

### Conversas

#### POST /inbox/conversations
Cria uma nova conversa.

**Body:**
```json
{
  "title": "Cliente João Silva", // opcional
  "contactName": "João Silva"    // opcional
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "OPEN",
  "lastMessageAt": null,
  "title": "Cliente João Silva",
  "contactName": "João Silva",
  "channel": "local",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "messagesCount": 0
}
```

#### GET /inbox/conversations
Lista conversas com paginação e filtros.

**Query Parameters:**
- `status` (opcional): `OPEN` ou `CLOSED`
- `q` (opcional): Busca por título ou nome do contato
- `page` (opcional): Número da página (padrão: 1)
- `pageSize` (opcional): Itens por página (padrão: 20, máximo: 100)

**Response:**
```json
{
  "data": [...],
  "total": 10,
  "page": 1,
  "pageSize": 20,
  "totalPages": 1
}
```

#### GET /inbox/conversations/:id
Busca uma conversa por ID com contagem de mensagens.

**Response:**
```json
{
  "id": "uuid",
  "status": "OPEN",
  "lastMessageAt": "2024-01-01T00:00:00Z",
  "title": "Cliente João Silva",
  "contactName": "João Silva",
  "channel": "local",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "messagesCount": 5
}
```

### Mensagens

#### POST /inbox/conversations/:conversationId/messages
Cria uma nova mensagem OUT na conversa.

**Body:**
```json
{
  "body": "Texto da mensagem"
}
```

**Response:**
```json
{
  "id": "uuid",
  "conversationId": "uuid",
  "direction": "OUT",
  "body": "Texto da mensagem",
  "readAt": null,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### GET /inbox/conversations/:conversationId/messages
Lista mensagens de uma conversa com paginação.

**Query Parameters:**
- `page` (opcional): Número da página (padrão: 1)
- `pageSize` (opcional): Itens por página (padrão: 50, máximo: 100)

**Response:**
```json
{
  "data": [...],
  "total": 10,
  "page": 1,
  "pageSize": 50,
  "totalPages": 1
}
```

## Passos de Uso

1. Criar uma conversa:
   ```bash
   POST /inbox/conversations
   {
     "title": "Cliente Teste",
     "contactName": "Teste"
   }
   ```

2. Enviar uma mensagem:
   ```bash
   POST /inbox/conversations/{conversationId}/messages
   {
     "body": "Olá! Como posso ajudar?"
   }
   ```

3. Listar conversas:
   ```bash
   GET /inbox/conversations?status=OPEN&page=1&pageSize=20
   ```

4. Listar mensagens de uma conversa:
   ```bash
   GET /inbox/conversations/{conversationId}/messages?page=1&pageSize=50
   ```

## Notas

- As conversas são ordenadas por `lastMessageAt` (desc) e depois `updatedAt` (desc)
- As mensagens são ordenadas por `createdAt` (asc) - ordem cronológica
- Ao criar uma mensagem, o campo `lastMessageAt` da conversa é atualizado automaticamente
- Todas as mensagens criadas via API têm direção `OUT`
