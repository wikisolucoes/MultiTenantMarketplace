# WikiStore NestJS Backend

Plataforma de e-commerce multi-tenant migrada de Express para NestJS com Prisma, incluindo integração com Celcoin e sistema de impostos brasileiros.

## 🚀 Tecnologias

- **NestJS 10+** - Framework Node.js modular
- **Prisma** - ORM para PostgreSQL
- **PostgreSQL** - Banco de dados principal
- **Swagger** - Documentação automática da API
- **Docker** - Containerização
- **TypeScript** - Tipagem estática

## 📁 Estrutura do Projeto

```
server-nestjs/
├── src/
│   ├── modules/           # Módulos da aplicação
│   │   ├── auth/         # Autenticação
│   │   ├── tenant/       # Gestão de inquilinos
│   │   ├── product/      # Produtos
│   │   ├── order/        # Pedidos
│   │   └── celcoin/      # Integração Celcoin
│   ├── shared/           # Serviços compartilhados
│   │   └── prisma/       # Configuração Prisma
│   ├── config/           # Configurações
│   ├── app.module.ts     # Módulo principal
│   └── main.ts           # Ponto de entrada
├── prisma/
│   └── schema.prisma     # Schema do banco
├── Dockerfile            # Configuração Docker
└── package.json          # Dependências
```

## 🛠️ Instalação

### Pré-requisitos
- Node.js 18+
- PostgreSQL
- Docker (opcional)

### Desenvolvimento Local

1. **Instalar dependências:**
```bash
cd server-nestjs
npm install
```

2. **Configurar variáveis de ambiente:**
```bash
# Copiar do projeto principal
DATABASE_URL="postgresql://user:password@localhost:5432/wikistore"
PORT=5001
NODE_ENV=development
```

3. **Gerar cliente Prisma:**
```bash
npm run prisma:generate
```

4. **Executar migrações:**
```bash
npm run prisma:migrate
```

5. **Iniciar aplicação:**
```bash
npm run start:dev
```

## 🐳 Docker

### Build da imagem:
```bash
docker build -t wikistore-nestjs .
```

### Executar container:
```bash
docker run -p 5001:5001 \
  -e DATABASE_URL="postgresql://user:password@host:5432/wikistore" \
  wikistore-nestjs
```

### Docker Compose (recomendado):
```yaml
version: '3.8'
services:
  nestjs-app:
    build: .
    ports:
      - "5001:5001"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/wikistore
      - NODE_ENV=production
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=wikistore
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 📚 API Documentation

A documentação Swagger está disponível em:
- **Desenvolvimento:** http://localhost:5001/api/docs
- **Produção:** https://your-domain.com/api/docs

### Principais Endpoints

#### Autenticação
- `POST /api/auth/login` - Login do usuário
- `POST /api/auth/logout` - Logout
- `GET /api/auth/user` - Usuário atual
- `GET /api/auth/check` - Status da autenticação

#### Tenant (Inquilinos)
- `GET /api/tenant/financial-stats` - Estatísticas financeiras
- `GET /api/tenant/products` - Produtos do tenant
- `GET /api/tenant/orders` - Pedidos do tenant
- `GET /api/tenant/withdrawals` - Saques do tenant

## 🔄 Migração do Express

### Endpoints Migrados

| Express Route | NestJS Equivalent | Status |
|---------------|-------------------|---------|
| `POST /api/login` | `POST /api/auth/login` | ✅ Migrado |
| `POST /api/logout` | `POST /api/auth/logout` | ✅ Migrado |
| `GET /api/auth/user` | `GET /api/auth/user` | ✅ Migrado |
| `GET /api/tenant/financial-stats` | `GET /api/tenant/financial-stats` | ✅ Migrado |
| `GET /api/tenant/products` | `GET /api/tenant/products` | ✅ Migrado |
| `GET /api/tenant/orders` | `GET /api/tenant/orders` | ✅ Migrado |

### Compatibilidade

- **Sessões:** Mantém compatibilidade com sessões Express
- **Database:** Usa o mesmo banco PostgreSQL
- **Frontend:** Compatível com frontend React existente
- **Autenticação:** Mantém mesmo fluxo de login/logout

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes e2e
npm run test:e2e

# Coverage
npm run test:cov
```

## 📋 Scripts Disponíveis

```bash
# Desenvolvimento
npm run start:dev       # Inicia com hot reload
npm run start:debug     # Inicia com debug

# Produção
npm run build          # Build da aplicação
npm run start:prod     # Inicia versão produção

# Prisma
npm run prisma:generate  # Gera cliente Prisma
npm run prisma:migrate   # Executa migrações
npm run prisma:studio    # Interface gráfica do banco

# Qualidade
npm run lint           # ESLint
npm run format         # Prettier
```

## 🔐 Variáveis de Ambiente

```bash
# Banco de dados
DATABASE_URL="postgresql://user:password@localhost:5432/wikistore"

# Servidor
PORT=5001
NODE_ENV=development

# Integração Celcoin (se necessário)
CELCOIN_CLIENT_ID=your_client_id
CELCOIN_CLIENT_SECRET=your_client_secret
CELCOIN_API_URL=https://sandbox.openfinance.celcoin.dev

# Email (SendGrid)
SENDGRID_API_KEY=your_sendgrid_key
```

## 📊 Monitoramento

### Health Check
- **Endpoint:** `/health`
- **Docker:** Health check configurado no Dockerfile

### Logs
- Logs estruturados via NestJS Logger
- Integração com sistemas externos via Winston (opcional)

## 🚀 Deploy

### Preparação para Produção

1. **Build da aplicação:**
```bash
npm run build
```

2. **Definir variáveis de ambiente de produção**

3. **Executar migrações:**
```bash
npm run prisma:deploy
```

4. **Iniciar aplicação:**
```bash
npm run start:prod
```

### Checklist de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados acessível
- [ ] Migrações executadas
- [ ] Health check funcionando
- [ ] SSL/TLS configurado
- [ ] Logs configurados

## 🔧 Troubleshooting

### Problemas Comuns

1. **Erro de conexão com banco:**
   - Verificar DATABASE_URL
   - Confirmar se PostgreSQL está rodando
   - Testar conectividade de rede

2. **Prisma client não encontrado:**
   ```bash
   npm run prisma:generate
   ```

3. **Porta já em uso:**
   - Alterar PORT no .env
   - Verificar processos rodando na porta

4. **Dependências não instaladas:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte a documentação Swagger
2. Verifique os logs da aplicação
3. Compare com implementação Express existente
4. Teste endpoints com Postman/Insomnia

## 🚦 Status da Migração

### ✅ Concluído
- Estrutura base NestJS
- Configuração Prisma
- Módulo de autenticação
- Módulo de tenant
- Documentação Swagger
- Containerização Docker

### 🚧 Em Progresso
- Migração completa de todos endpoints
- Implementação de guards/middleware
- Testes automatizados
- Integração completa Celcoin

### 📋 Pendente
- Migração de endpoints de produtos
- Migração de endpoints de pedidos
- Sistema de logs avançado
- Métricas e monitoramento