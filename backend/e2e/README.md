# Testes E2E - Backend

Este diretório contém os testes end-to-end da API do backend usando Playwright.

## Estrutura

```
e2e/
├── tests/
│   └── api.spec.ts           # Testes de API
└── playwright.config.ts       # Configuração do Playwright
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
2. O Playwright iniciará automaticamente o backend na porta 3000

## Configuração

O Playwright está configurado para:
- Iniciar automaticamente o servidor backend antes dos testes
- Usar a API request (sem navegador)
- Timeout de 30s para requisições
- 1 worker para evitar conflitos

## Credenciais de Teste

As credenciais padrão são do seed do banco:
- Usuário: `ADMIN`
- Senha: `ADMIN123`


