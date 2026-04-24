# Estrutura de Diretórios - Frontend AccessPIM

## 📁 Organização do Projeto

```
src/app/
├── core/                    # Funcionalidades globais e singleton
│   ├── auth/               # Guards e lógica de autenticação
│   ├── models/             # Interfaces e enums globais
│   ├── services/           # Serviços como AuthService, ApiService
│   └── interceptors/       # Interceptadores HTTP (tokens, erros)
│
├── features/               # Features/módulos específicos do app
│   ├── auth/               # Feature de autenticação
│   │   └── login/          # Componente de login
│   ├── colaborador/        # Feature de gerenciamento de colaboradores
│   ├── area/               # Feature de gerenciamento de áreas
│   └── dashboard/          # Feature de dashboard
│
├── shared/                 # Componentes, pipes, diretivas reutilizáveis
│   ├── components/         # Componentes compartilhados
│   └── utils/              # Funções e helpers genéricas
│
└── app.routes.ts           # Configuração de rotas
```

## 📖 O que vai em cada lugar?

### `/core` (Singleton, Global)
- **Serviços**: `AuthService`, `ApiService`, `NotificacaoService`
- **Guards**: `AuthGuard`, `RoleGuard`
- **Interceptadores**: `TokenInterceptor`, `ErrorInterceptor`
- **Modelos**: `Perfil.enum`, `Usuario`, `AuthResponse`

### `/features` (Features Específicas)
- Componentes de páginas específicas
- Serviços locais da feature
- Rotas filhas da feature

### `/shared` (Reutilizável)
- Botões, cards, modais, headers customizados
- Pipes (`CurrencyPipe`, etc)
- Funções helpers (`formatarData()`, `validarCNPJ()`)

## 🔄 Como Importar?

```typescript
// ✅ Correto
import { Perfil } from '@core/models/perfil.enum';
import { Login } from '@features/auth/login/login';
import { SharedButton } from '@shared/components/button';

// ❌ Evitar caminhos longos
import { Perfil } from '../../../core/models/perfil.enum';
```

## 🚀 Próximos Passos
1. Criar `AuthService` em `/core/services`
2. Criar `ApiService` em `/core/services`
3. Criar `AuthGuard` em `/core/auth`
4. Implementar formulário de login
5. Integrar com backend
