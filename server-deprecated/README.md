# WikiStore Backend Server

Backend Node.js/Express.js para a plataforma WikiStore com arquitetura multi-tenant e integração financeira completa.

## 🏗️ Arquitetura

### Stack Principal
- **Node.js 18+** com TypeScript
- **Express.js** para API REST
- **WebSocket** para comunicação em tempo real
- **Drizzle ORM** com PostgreSQL
- **JWT** para autenticação segura

### Estrutura de Diretórios
```
server/
├── index.ts              # Ponto de entrada da aplicação
├── routes.ts             # Rotas principais e controllers
├── db.ts                 # Configuração do banco de dados
├── storage.ts            # Camada de abstração de dados
├── vite.ts               # Integração com Vite para servir frontend
├── api-auth.ts           # Sistema de autenticação de API
├── api-docs-html.ts      # Geração de documentação HTML
├── celcoin-integration.ts # Integração com gateway Celcoin
├── email-service.ts      # Serviços de envio de e-mail
├── public-api.ts         # API pública para desenvolvedores
├── security.ts           # Utilitários de segurança
├── swagger-config.ts     # Configuração do Swagger/OpenAPI
└── seed*.ts              # Scripts de população do banco
```

## 🔌 APIs Principais

### Autenticação e Usuários
```
POST   /api/login                    # Login de usuários
POST   /api/register                 # Registro de novos usuários
GET    /api/profile                  # Perfil do usuário autenticado
PUT    /api/profile                  # Atualização de perfil
POST   /api/logout                   # Logout
```

### Gestão de Tenants (Admin)
```
GET    /api/admin/tenants            # Listar todos os tenants
POST   /api/admin/tenants            # Criar novo tenant
GET    /api/admin/tenants/:id        # Detalhes de um tenant
PUT    /api/admin/tenants/:id        # Atualizar tenant
DELETE /api/admin/tenants/:id        # Deletar tenant
```

### Produtos e E-commerce
```
GET    /api/tenant/products          # Produtos do tenant
POST   /api/tenant/products          # Criar produto
GET    /api/tenant/products/:id      # Detalhes do produto
PUT    /api/tenant/products/:id      # Atualizar produto
DELETE /api/tenant/products/:id      # Deletar produto

GET    /api/tenant/orders            # Pedidos do tenant
POST   /api/tenant/orders            # Criar pedido
GET    /api/tenant/orders/:id        # Detalhes do pedido
PUT    /api/tenant/orders/:id        # Atualizar pedido
```

### Sistema Financeiro (Celcoin)
```
GET    /api/celcoin/account/balance     # Saldo da conta
GET    /api/celcoin/account/statement   # Extrato financeiro
POST   /api/celcoin/pix/create          # Criar pagamento PIX
POST   /api/celcoin/boleto/create       # Criar boleto bancário
GET    /api/celcoin/payment/:id/status  # Status do pagamento
POST   /api/celcoin/withdrawal/create   # Solicitar saque
```

### Plugins e Marketplace
```
GET    /api/admin/plugins            # Listar plugins
POST   /api/admin/plugins            # Criar plugin
GET    /api/tenant/plugin-subscriptions # Assinaturas do tenant
POST   /api/tenant/plugin-subscriptions # Nova assinatura
```

### API Pública (v1)
```
GET    /api/public/v1/info           # Informações da API
GET    /api/public/v1/products       # Listar produtos
GET    /api/public/v1/products/:id   # Detalhes do produto
POST   /api/public/v1/products       # Criar produto
PUT    /api/public/v1/products/:id   # Atualizar produto
DELETE /api/public/v1/products/:id   # Deletar produto

GET    /api/public/v1/orders         # Listar pedidos
GET    /api/public/v1/orders/:id     # Detalhes do pedido
PUT    /api/public/v1/orders/:id/status # Atualizar status
```

## 🔐 Sistema de Autenticação

### Autenticação JWT
```typescript
// Middleware de autenticação
const isAuthenticated = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token required' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
```

### Autenticação de API (Bearer Token)
```typescript
// Formato: Authorization: Bearer API_KEY:SECRET
const authenticateApi = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Bearer token required' });
  }
  
  const [apiKey, secret] = authHeader.slice(7).split(':');
  const credential = await validateApiCredentials(apiKey, secret);
  
  if (!credential) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  req.apiCredential = credential;
  next();
};
```

## 💾 Banco de Dados

### Schema Multi-Tenant
```sql
-- Tenants principais
CREATE TABLE tenants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  plan_type VARCHAR(50) DEFAULT 'basic',
  address JSONB,
  settings JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Usuários por tenant
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Produtos por tenant
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock INTEGER DEFAULT 0,
  sku VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Operações do Drizzle ORM
```typescript
import { db } from './db';
import { products, tenants, eq } from '@shared/schema';

// Buscar produtos de um tenant
const getProductsByTenant = async (tenantId: number) => {
  return await db.select()
    .from(products)
    .where(eq(products.tenantId, tenantId));
};

// Criar novo produto
const createProduct = async (productData: any) => {
  const [product] = await db.insert(products)
    .values(productData)
    .returning();
  return product;
};

// Atualizar produto
const updateProduct = async (id: number, updates: any) => {
  const [product] = await db.update(products)
    .set(updates)
    .where(eq(products.id, id))
    .returning();
  return product;
};
```

## 💳 Integração Celcoin

### Configuração
```typescript
class CelcoinIntegration {
  private config = {
    apiUrl: process.env.CELCOIN_API_URL,
    clientId: process.env.CELCOIN_CLIENT_ID,
    clientSecret: process.env.CELCOIN_CLIENT_SECRET,
    environment: process.env.CELCOIN_ENVIRONMENT || 'sandbox'
  };
  
  async authenticate() {
    const response = await axios.post(`${this.config.apiUrl}/token`, {
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: 'client_credentials'
    });
    
    this.accessToken = response.data.access_token;
  }
}
```

### Pagamentos PIX
```typescript
async createPixPayment(request: CelcoinPixPaymentRequest) {
  await this.ensureValidToken();
  
  const response = await this.api.post('/pix/payment', {
    merchant: request.merchant,
    amount: request.amount,
    correlationID: request.correlationID,
    expiresDate: request.expiresDate,
    payer: request.payer
  });
  
  return response.data;
}
```

### Boletos Bancários
```typescript
async createBoleto(request: CelcoinBoletoRequest) {
  await this.ensureValidToken();
  
  const response = await this.api.post('/boleto', {
    merchant: request.merchant,
    amount: request.amount,
    correlationID: request.correlationID,
    expiresDate: request.expiresDate,
    payer: request.payer
  });
  
  return response.data;
}
```

## 📧 Sistema de E-mails

### Integração SendGrid
```typescript
import { MailService } from '@sendgrid/mail';

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendEmail(params: EmailParams) {
  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      html: params.html,
      text: params.text
    });
    return true;
  } catch (error) {
    console.error('SendGrid error:', error);
    return false;
  }
}
```

### Templates de E-mail
```typescript
export function createNotificationTemplate(
  type: string,
  data: any
): { subject: string; html: string; text: string } {
  const templates = {
    order_confirmed: {
      subject: `Pedido #${data.orderId} confirmado`,
      html: `<h1>Pedido Confirmado</h1><p>Seu pedido foi confirmado...</p>`,
      text: `Pedido #${data.orderId} confirmado`
    },
    payment_received: {
      subject: 'Pagamento recebido',
      html: `<h1>Pagamento Confirmado</h1><p>Recebemos seu pagamento...</p>`,
      text: 'Pagamento confirmado'
    }
  };
  
  return templates[type] || templates.default;
}
```

## 🔌 WebSocket em Tempo Real

### Configuração do WebSocket
```typescript
import { WebSocketServer, WebSocket } from 'ws';

const wss = new WebSocketServer({ 
  server: httpServer, 
  path: '/ws' 
});

wss.on('connection', (ws: WebSocket, request) => {
  const tenantId = extractTenantFromRequest(request);
  
  ws.on('message', (message) => {
    const data = JSON.parse(message.toString());
    handleWebSocketMessage(ws, data, tenantId);
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});
```

### Eventos em Tempo Real
```typescript
// Notificar novo pedido
const notifyNewOrder = (tenantId: number, orderData: any) => {
  const message = JSON.stringify({
    type: 'new_order',
    data: orderData,
    timestamp: new Date().toISOString()
  });
  
  broadcastToTenant(tenantId, message);
};

// Atualizar status de pagamento
const notifyPaymentUpdate = (tenantId: number, paymentData: any) => {
  const message = JSON.stringify({
    type: 'payment_update',
    data: paymentData,
    timestamp: new Date().toISOString()
  });
  
  broadcastToTenant(tenantId, message);
};
```

## 📊 Sistema de Logs e Monitoramento

### Logs Estruturados
```typescript
interface LogEntry {
  level: 'info' | 'warn' | 'error';
  message: string;
  tenantId?: number;
  userId?: number;
  metadata?: any;
  timestamp: string;
}

const logger = {
  info: (message: string, metadata?: any) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      metadata,
      timestamp: new Date().toISOString()
    }));
  },
  
  error: (message: string, error: Error, metadata?: any) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error.message,
      stack: error.stack,
      metadata,
      timestamp: new Date().toISOString()
    }));
  }
};
```

### Métricas de Performance
```typescript
const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('API Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('user-agent')
    });
  });
  
  next();
};
```

## 🔒 Segurança

### Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: 'Too many requests from this IP'
});

app.use('/api/public', apiLimiter);
```

### Validação de Dados
```typescript
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  price: z.number().positive(),
  stock: z.number().int().min(0),
  sku: z.string().optional()
});

const validateProduct = (req: Request, res: Response, next: NextFunction) => {
  try {
    productSchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', errors: error.errors });
  }
};
```

## 🚀 Scripts de Desenvolvimento

### Comandos Disponíveis
```bash
# Desenvolvimento
npm run dev              # Servidor de desenvolvimento com hot reload
npm run build            # Build para produção
npm run start            # Iniciar servidor de produção

# Banco de Dados
npm run db:push          # Aplicar mudanças no schema
npm run db:seed          # Popular com dados de teste
npm run db:studio        # Interface visual do banco

# Qualidade
npm run lint             # Verificar código
npm run type-check       # Verificar tipos TypeScript
npm run test             # Executar testes
```

### Variáveis de Ambiente
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/wikistore"

# JWT
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRES_IN="7d"

# Celcoin
CELCOIN_API_URL="https://sandbox.openfinance.celcoin.dev/v5"
CELCOIN_CLIENT_ID="your-client-id"
CELCOIN_CLIENT_SECRET="your-client-secret"
CELCOIN_ENVIRONMENT="sandbox"

# SendGrid
SENDGRID_API_KEY="your-sendgrid-api-key"

# Session
SESSION_SECRET="your-session-secret"

# Server
PORT=5000
NODE_ENV="development"
```

## 📈 Performance e Otimização

### Cache e Performance
```typescript
// Cache em memória para dados frequentemente acessados
const cache = new Map();

const getCachedData = async (key: string, fetchFn: Function, ttl: number = 300000) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  
  const data = await fetchFn();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
};
```

### Otimização de Queries
```typescript
// Buscar produtos com relacionamentos
const getProductsWithDetails = async (tenantId: number) => {
  return await db.select({
    id: products.id,
    name: products.name,
    price: products.price,
    categoryName: categories.name,
    brandName: brands.name
  })
  .from(products)
  .leftJoin(categories, eq(products.categoryId, categories.id))
  .leftJoin(brands, eq(products.brandId, brands.id))
  .where(eq(products.tenantId, tenantId));
};
```

## 🧪 Testes e Qualidade

### Testes de Integração
```typescript
import request from 'supertest';
import { app } from '../index';

describe('Products API', () => {
  test('GET /api/tenant/products', async () => {
    const response = await request(app)
      .get('/api/tenant/products')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
      
    expect(response.body).toBeInstanceOf(Array);
  });
  
  test('POST /api/tenant/products', async () => {
    const productData = {
      name: 'Test Product',
      price: 99.99,
      stock: 10
    };
    
    const response = await request(app)
      .post('/api/tenant/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send(productData)
      .expect(201);
      
    expect(response.body.name).toBe(productData.name);
  });
});
```

## 📚 Recursos Adicionais

- **Swagger UI**: `/api/docs` - Documentação interativa
- **Health Check**: `/api/health` - Status do servidor
- **Metrics**: `/api/metrics` - Métricas de performance
- **Admin Panel**: `/api/admin/*` - Endpoints administrativos

---

**WikiStore Backend** - API robusta e escalável para e-commerce multi-tenant