# Bombocado - Frontend

Frontend do sistema Bombocado construído com Next.js 14, TypeScript e Tailwind CSS.

## 📋 Funcionalidades Implementadas

### ✅ Autenticação
- Página de login com validação
- Proteção de rotas
- Gerenciamento de sessão com JWT
- Validação automática de token

### ✅ Páginas
- **Home**: Página inicial com redirecionamento automático
- **Login**: Sistema de autenticação completo
- **Perfil**: Dashboard do usuário com 3 abas:
  - Informações pessoais (com edição)
  - Estatísticas
  - Log de atividades

### ✅ Componentes
- Button (múltiplas variantes)
- Input (com validação)
- ProtectedRoute (proteção de rotas)

### ✅ Hooks
- useAuth: Gerenciamento completo de autenticação

## 🚀 Como Rodar

1. **Instalar dependências:**
```bash
npm install
```

2. **Configurar variáveis de ambiente:**
```bash
# gerado automaticamente a partir da raiz (.env)
# mas pode ser criado manualmente, se necessário
# exemplo:
# NEXT_PUBLIC_API_URL=http://localhost:3000
```

3. **Iniciar servidor de desenvolvimento:**
```bash
npm run dev
```

O frontend estará disponível em `http://localhost:3001`

## 📁 Estrutura do Projeto

```
frontend/
├── src/
│   ├── app/              # Páginas do Next.js
│   │   ├── login/        # Página de login
│   │   ├── perfil/       # Página de perfil
│   │   └── page.tsx      # Página inicial
│   ├── components/       # Componentes reutilizáveis
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── ProtectedRoute.tsx
│   ├── hooks/            # Hooks customizados
│   │   └── useAuth.tsx   # Hook de autenticação
│   ├── lib/              # Bibliotecas e utilidades
│   │   └── api.ts        # Configuração do Axios
│   └── types/            # Tipos TypeScript
│       ├── auth.ts
│       └── index.ts
└── public/
```

## 🔐 Fluxo de Autenticação

1. Usuário faz login na página `/login`
2. Credenciais são enviadas para o backend em `/auth/login`
3. Backend retorna um JWT token e dados do usuário
4. Token é armazenado no localStorage
5. Token é incluído automaticamente em todas as requisições
6. Rotas protegidas verificam a autenticação antes de renderizar
7. Se o token expirar ou for inválido, o usuário é redirecionado para o login

## 🎨 Interface

O sistema utiliza um design moderno e responsivo com:
- Cores temáticas laranja/âmbar
- Componentes acessíveis
- Animações suaves
- Layout responsivo

## 📝 Próximos Passos

- Implementar tela de registro de usuários
- Adicionar mais estatísticas na dashboard
- Implementar histórico completo de atividades
- Adicionar mudança de senha
- Implementar upload de foto de perfil
