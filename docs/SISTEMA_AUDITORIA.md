# 📋 Sistema de Auditoria - Bombocado

## 📖 Visão Geral

O sistema de auditoria registra automaticamente todas as atividades relevantes dos usuários no sistema, como login, logout e edições de perfil. A arquitetura utiliza **Redis (BullMQ)** como fila intermediária e **PostgreSQL** como armazenamento final, garantindo desempenho e confiabilidade.

## 🏗️ Arquitetura

### Fluxo de Funcionamento

1. **Evento Ocorre** → Uma ação do usuário é detectada (login, logout, update de perfil)
2. **Enfileiramento** → O evento é enviado para a fila Redis (`audit-log-queue`)
3. **Processamento** → Um processor (BullMQ) consome a fila assincronamente
4. **Persistência** → O registro é salvo no PostgreSQL via Prisma

### Fallback de Segurança

- Se o Redis estiver offline ou falhar, o sistema **grava direto no PostgreSQL**
- Garante que nenhum log seja perdido
- Transparente para o usuário

## 🎯 Eventos Rastreados

| Evento | Descrição | Onde é Registrado |
|--------|-----------|-------------------|
| `user.login` | Usuário faz login | AuthController |
| `user.logout` | Usuário faz logout | AuthController |
| `user.register` | Novo usuário se registra | AuthController |
| `user.profile.update` | Usuário atualiza informações do perfil | UsersController |

## 📊 Dados Capturados

Para cada evento, o sistema registra:

- **userId**: ID do usuário
- **event**: Tipo de evento (ex: `user.login`)
- **entity**: Entidade relacionada (ex: `user`)
- **entityId**: ID da entidade
- **ip**: Endereço IP do usuário
- **userAgent**: Informações do navegador/dispositivo
- **meta**: Metadados adicionais (JSON)
- **createdAt**: Timestamp do evento

## 🔧 Componentes do Backend

### 1. AuditModule (`backend/src/audit/`)

Módulo global que centraliza a funcionalidade de auditoria.

```typescript
@Global()
@Module({
  imports: [
    BullModule.registerQueue({ name: 'audit-log-queue' }),
    PrismaModule,
  ],
  controllers: [AuditController],
  providers: [AuditService, AuditProcessor],
  exports: [AuditService],
})
```

### 2. AuditService

Serviço responsável por enfileirar eventos:

```typescript
async log(auditEvent: AuditEvent): Promise<void>
```

- Tenta enfileirar no Redis
- Se falhar, grava direto no PostgreSQL

### 3. AuditProcessor

Consumidor da fila que processa eventos assincronamente:

- Processa jobs da fila `audit-log-queue`
- Insere registros no banco via Prisma
- Retry automático em caso de falha (3 tentativas)

### 4. AuditController

Endpoint para consulta de logs:

```typescript
GET /audit/:userId?page=1&limit=50
```

- Paginação automática
- Ordenação por data (mais recente primeiro)
- Autorização: usuário só acessa seus próprios logs (ou admin acessa todos)

## 🗄️ Estrutura do Banco de Dados

### Tabela: `audit_logs`

```prisma
model AuditLog {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(...)
  event       String   @db.VarChar(100)
  entity      String?  @db.VarChar(100)
  entityId    String?
  ip          String?  @db.VarChar(45)
  userAgent   String?  @db.VarChar(512)
  meta        Json?    @default("{}")
  createdAt   DateTime @default(now())
  
  @@index([userId])
  @@index([event])
  @@index([createdAt])
  @@map("audit_logs")
}
```

### Índices

- `userId`: Consultas por usuário
- `event`: Filtrar por tipo de evento
- `createdAt`: Ordenação temporal

## 🖥️ Interface Frontend

### Localização

**Perfil do Usuário** → **Aba "Log de Atividades"**

### Funcionalidades

- ✅ Lista completa de atividades do usuário
- ✅ Formatação amigável de eventos (ex: "entrou", "saiu", "atualizou o perfil")
- ✅ Exibição de data/hora formatada (pt-BR)
- ✅ Exibição de IP quando disponível
- ✅ Loading state enquanto carrega
- ✅ Placeholder quando não há logs
- ✅ Botão "Reportar Atividade Suspeita" (funcionalidade futura)

### Exemplo de Exibição

```
┌─────────────────────────────────────────────────────────┐
│ 📥 Eric Escolástico entrou                              │
│    IP: 192.168.1.100                 01/11/2025 10:30  │
├─────────────────────────────────────────────────────────┤
│ ⚙️ Eric Escolástico atualizou o perfil                 │
│    IP: 192.168.1.100                 01/11/2025 09:15  │
├─────────────────────────────────────────────────────────┤
│ 📤 Eric Escolástico saiu                               │
│    IP: 192.168.1.100                 31/10/2025 18:45  │
└─────────────────────────────────────────────────────────┘
```

## ⚙️ Configuração

### Variáveis de Ambiente

```env
# Redis Configuration
REDIS_HOST="localhost"
REDIS_PORT="6379"

# Se Redis não estiver disponível, o sistema grava direto no PostgreSQL
```

### Iniciando o Redis

#### Docker (Recomendado)
```bash
docker run -d -p 6379:6379 redis:latest
```

#### Windows
Baixe em: https://redis.io/download

## 🔄 Fluxo de Integração

### Adicionando Novos Eventos

1. **Importe o AuditService** no controller:
```typescript
import { AuditService } from '../audit/audit.service';

constructor(
  private auditService: AuditService,
) {}
```

2. **Capture IP e User-Agent**:
```typescript
@Post('some-action')
async someAction(
  @Body() body: SomeDto,
  @Ip() ip: string,
  @Headers('user-agent') userAgent: string,
) {
  // ... sua lógica ...
  
  await this.auditService.log({
    userId: req.user.userId,
    event: 'custom.action',
    entity: 'entity_name',
    entityId: 'entity_id',
    ip,
    userAgent,
    meta: { /* dados adicionais */ },
  });
}
```

## 📈 Performance

### Otimizações

- **Processamento Assíncrono**: Redis evita bloqueio das requisições
- **Retry Automático**: Falhas temporárias são reprocessadas
- **Fallback Inteligente**: Sistema continua funcionando sem Redis
- **Índices no Banco**: Consultas rápidas por usuário/data/evento

### Escalabilidade

- Redis pode ser escalado horizontalmente
- Multiple workers podem processar a fila em paralelo
- PostgreSQL armazena histórico completo

## 🧪 Testes

### Cenários Testados

- ✅ Login cria registro "usuário entrou"
- ✅ Logout cria registro "usuário saiu"
- ✅ Atualização de perfil cria registro "usuário atualizou o perfil"
- ✅ Logs aparecem corretamente na interface
- ✅ Redis offline → sistema grava direto no PostgreSQL
- ✅ Endpoint `/audit/:userId` retorna dados paginados

## 🔒 Segurança

- **Autorização**: Usuários só acessam seus próprios logs
- **Admins**: Podem acessar logs de qualquer usuário
- **IP e User-Agent**: Capturados automaticamente
- **Metadados**: Campos extras para investigação futura

## 🚀 Próximas Melhorias

- [ ] Dashboard de auditoria para admins
- [ ] Alertas para atividades suspeitas
- [ ] Exportação de logs (CSV, PDF)
- [ ] Filtros avançados (por evento, data, IP)
- [ ] Visualização de gráficos de atividades
- [ ] Integração com notificações

## 📚 Referências

- [BullMQ Documentation](https://docs.bullmq.io/)
- [NestJS Bull Module](https://docs.nestjs.com/techniques/queues)
- [Prisma Schema](https://www.prisma.io/docs/concepts/components/prisma-schema)

