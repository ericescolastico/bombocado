# Testes E2E - Frontend

Este diretório contém os testes end-to-end do frontend usando Playwright.

## Estrutura

```
e2e/
├── tests/
│   ├── auth.spec.ts          # Testes de autenticação
│   └── navigation.spec.ts     # Testes de navegação
├── fixtures/
│   └── auth.ts               # Helpers de autenticação
└── playwright.config.ts      # Configuração do Playwright
```

## Comandos

### Executar todos os testes
```bash
npm run test:e2e
```

### Executar com UI interativa
```bash
npm run test:e2e:ui
```

### Executar em modo debug
```bash
npm run test:e2e:debug
```

## Pré-requisitos

1. Docker Compose deve estar rodando (Postgres e Redis)
2. Backend deve estar rodando na porta 3000
3. O Playwright iniciará automaticamente o frontend na porta 3001

## Configuração

O Playwright está configurado para:
- Iniciar automaticamente o servidor frontend antes dos testes
- Usar Chromium como navegador padrão
- Fazer screenshots e vídeos apenas em falhas
- Timeout de 30s para ações e 60s para navegação
- 1 worker para evitar conflitos

## Credenciais de Teste

As credenciais padrão são do seed do banco:
- Usuário: `ADMIN`
- Senha: `ADMIN123`


