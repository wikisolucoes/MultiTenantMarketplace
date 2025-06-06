# WikiStore - Plataforma SaaS Multi-Tenant E-commerce

Uma plataforma completa de e-commerce SaaS multi-tenant especializada no mercado brasileiro, com integração financeira avançada e conformidade fiscal.

## 🚀 Características Principais

### 📊 Multi-Tenant & Escalabilidade
- **Isolamento de dados por tenant** com PostgreSQL
- **Subdomínios personalizados** para cada loja
- **Temas dinâmicos** com 10+ layouts profissionais
- **Performance otimizada** com caching e CDN

### 💰 Sistema Financeiro Avançado
- **Integração Celcoin** para pagamentos PIX e boleto
- **Gateway de pagamentos** multi-provider
- **Ledger financeiro** com rastreamento completo
- **Relatórios fiscais** automatizados
- **Sistema de saques** e transferências

### 🇧🇷 Conformidade Fiscal Brasileira
- **Configuração tributária completa** (ICMS, IPI, PIS, COFINS)
- **Geração de NF-e** automática
- **Importação XML** para gestão de estoque
- **Códigos NCM e CFOP** integrados
- **Cálculo automático de impostos**

### 🛍️ E-commerce Completo
- **Gestão de produtos** com variações e especificações
- **Sistema de categorias** hierárquico
- **Gestão de marcas** e fornecedores
- **Controle de estoque** em tempo real
- **Promoções e descontos** avançados

### 🔌 Sistema de Plugins
- **Marketplace de plugins** integrado
- **Assinaturas mensais/anuais** automatizadas
- **API pública** para desenvolvedores
- **SDK de desenvolvimento** de plugins
- **Sistema de permissões** granular

### 📱 Integrações de Marketplace
- **Mercado Livre** - Sincronização automática
- **Shopee** - Gestão de produtos e pedidos
- **Amazon** - Integração completa
- **Instagram Shopping** - Catálogo sincronizado
- **Google Shopping** - Feed automático

### 🛡️ Segurança & Compliance
- **Autenticação JWT** segura
- **Rate limiting** por API
- **Logs de auditoria** completos
- **Conformidade LGPD** integrada
- **Backup automático** de dados

### 📞 Suporte Integrado
- **Sistema de tickets** multi-nível
- **Chat em tempo real** com WebSocket
- **Base de conhecimento** com FAQ
- **Métricas de satisfação** do cliente
- **SLA tracking** automatizado

## 🏗️ Arquitetura Técnica

```
├── Frontend (React + TypeScript)
│   ├── Dashboard Admin/Merchant
│   ├── Storefront Público
│   ├── Sistema de Temas
│   └── Interface de Plugins
│
├── Backend (Node.js + Express)
│   ├── API REST completa
│   ├── WebSocket para tempo real
│   ├── Sistema de autenticação
│   └── Integração com serviços externos
│
├── Banco de Dados (PostgreSQL)
│   ├── Schema multi-tenant
│   ├── Índices otimizados
│   ├── Backup automático
│   └── Migrations versionadas
│
└── Integrações Externas
    ├── Celcoin (Pagamentos)
    ├── SendGrid (E-mail)
    ├── Correios (Frete)
    └── Receita Federal (NFe)
```

## 🛠️ Stack Tecnológica

### Frontend
- **React 18** com TypeScript
- **Tailwind CSS** + shadcn/ui
- **TanStack Query** para state management
- **Wouter** para roteamento
- **Framer Motion** para animações

### Backend
- **Node.js** com Express.js
- **TypeScript** para type safety
- **Drizzle ORM** com PostgreSQL
- **WebSocket** para tempo real
- **JWT** para autenticação

### DevOps & Tools
- **Vite** para build e desenvolvimento
- **ESLint + Prettier** para qualidade
- **GitHub Actions** para CI/CD
- **Docker** para containerização
- **Monitoring** com logs estruturados

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 18+ e npm
- PostgreSQL 14+
- Conta Celcoin (sandbox/produção)
- Conta SendGrid para e-mails

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/wikistore.git
cd wikistore
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
# Database
DATABASE_URL="postgresql://usuario:senha@localhost:5432/wikistore"

# Celcoin
CELCOIN_CLIENT_ID="seu_client_id"
CELCOIN_CLIENT_SECRET="seu_client_secret"
CELCOIN_ENVIRONMENT="sandbox"

# SendGrid
SENDGRID_API_KEY="sua_api_key"

# Session
SESSION_SECRET="seu_secret_muito_seguro"
```

4. **Configure o banco de dados**
```bash
npm run db:push
npm run db:seed
```

5. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5000`

## 👥 Contas de Demonstração

### Administrador da Plataforma
- **E-mail:** admin@wikistore.com
- **Senha:** admin123
- **Acesso:** Painel administrativo completo

### Merchant (Lojista)
- **E-mail:** joao@exemplo.com
- **Senha:** demo123
- **Tenant:** Loja Demo (ID: 5)

## 📖 Documentação da API

### Acesso à Documentação
- **Swagger UI:** `/api/docs`
- **Documentação HTML:** `/api/docs/html`
- **OpenAPI JSON:** `/api/docs/swagger.json`

### Autenticação da API
```bash
# Obter token de API
curl -X POST http://localhost:5000/api/merchant/credentials \
  -H "Content-Type: application/json" \
  -d '{"name": "Minha Integração", "permissions": ["products:read"]}'

# Usar token nas requisições
curl -H "Authorization: Bearer API_KEY:SECRET" \n  http://localhost:5000/api/public/v1/products
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview da build

# Database
npm run db:push      # Aplicar mudanças no schema
npm run db:seed      # Popular banco com dados de teste
npm run db:studio    # Interface visual do banco

# Qualidade
npm run lint         # Verificar código
npm run type-check   # Verificar tipos TypeScript
npm run test         # Executar testes
```

## 🌟 Funcionalidades em Destaque

### 💳 Pagamentos com Celcoin
- PIX instantâneo com QR Code
- Boleto bancário com vencimento
- Transferências TED automáticas
- Extrato financeiro completo

### 📊 Dashboard Administrativo
- Métricas em tempo real
- Gestão de todos os tenants
- Monitoramento financeiro
- Logs de auditoria

### 🛒 Storefront Personalizado
- 10+ temas profissionais
- Responsivo e otimizado
- SEO automático
- Performance otimizada

### 🔌 Sistema de Plugins
- Marketplace integrado
- Desenvolvimento facilitado
- Monetização automática
- Distribuição global

## 📈 Roadmap

### Q1 2025
- [ ] Integração com WhatsApp Business
- [ ] App mobile nativo (React Native)
- [ ] IA para recomendações de produtos
- [ ] Análise preditiva de vendas

### Q2 2025
- [ ] Integração com ERP populares
- [ ] Marketplace internacional
- [ ] Sistema de afiliados
- [ ] Programa de parceiros

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

- **E-mail:** suporte@wikistore.com
- **Documentação:** [docs.wikistore.com](https://docs.wikistore.com)
- **Issues:** [GitHub Issues](https://github.com/seu-usuario/wikistore/issues)
- **Discord:** [Comunidade WikiStore](https://discord.gg/wikistore)

## 🙏 Agradecimentos

- **Replit** - Plataforma de desenvolvimento
- **Celcoin** - Solução de pagamentos
- **shadcn/ui** - Componentes de interface
- **Drizzle** - ORM TypeScript
- **Comunidade open source** - Bibliotecas e ferramentas

---

**WikiStore** - Transformando o e-commerce brasileiro 🇧🇷