import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WikiStore E-commerce API',
      version: '1.0.0',
      description: `
        API de Integração da WikiStore para conectar sistemas externos com sua loja virtual.
        
        ## Autenticação
        
        Esta API utiliza autenticação Bearer Token com credenciais geradas no painel do lojista.
        
        ### Como obter credenciais:
        1. Acesse o painel administrativo da sua loja
        2. Vá para "API de Integração"
        3. Crie uma nova credencial com as permissões necessárias
        4. Use o formato: \`API_KEY:API_SECRET\`
        
        ### Exemplo de autenticação:
        \`\`\`
        Authorization: Bearer wks_abc123:secret_xyz789
        \`\`\`
        
        ## Rate Limiting
        
        A API possui limite de requisições por hora baseado na configuração da credencial (padrão: 1000/hora).
        
        ## Formatos de Resposta
        
        Todas as respostas seguem o padrão JSON com os seguintes formatos:
        
        ### Sucesso (Lista):
        \`\`\`json
        {
          "data": [...],
          "pagination": {
            "page": 1,
            "limit": 50,
            "total": 100,
            "pages": 2
          }
        }
        \`\`\`
        
        ### Sucesso (Item único):
        \`\`\`json
        {
          "id": 1,
          "name": "Produto Exemplo",
          ...
        }
        \`\`\`
        
        ### Erro:
        \`\`\`json
        {
          "error": "VALIDATION_ERROR",
          "message": "Descrição do erro",
          "details": [...]
        }
        \`\`\`
      `,
      contact: {
        name: 'Suporte WikiStore',
        email: 'suporte@wikistore.com.br'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: '/api/public/v1',
        description: 'Servidor de Produção'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'API_KEY:API_SECRET',
          description: 'Use o formato: API_KEY:API_SECRET obtido no painel administrativo'
        }
      },
      schemas: {
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único do produto'
            },
            name: {
              type: 'string',
              description: 'Nome do produto'
            },
            description: {
              type: 'string',
              description: 'Descrição detalhada do produto'
            },
            price: {
              type: 'number',
              format: 'decimal',
              description: 'Preço do produto em reais'
            },
            stock: {
              type: 'integer',
              description: 'Quantidade em estoque'
            },
            sku: {
              type: 'string',
              description: 'Código SKU do produto'
            },
            categoryId: {
              type: 'integer',
              description: 'ID da categoria'
            },
            brandId: {
              type: 'integer',
              description: 'ID da marca'
            },
            weight: {
              type: 'number',
              description: 'Peso em gramas'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data da última atualização'
            }
          }
        },
        CreateProduct: {
          type: 'object',
          required: ['name', 'price', 'stock'],
          properties: {
            name: {
              type: 'string',
              description: 'Nome do produto',
              example: 'Smartphone Galaxy S24'
            },
            description: {
              type: 'string',
              description: 'Descrição do produto',
              example: 'Smartphone com 128GB de armazenamento'
            },
            price: {
              type: 'number',
              format: 'decimal',
              description: 'Preço em reais',
              example: 2999.99
            },
            stock: {
              type: 'integer',
              description: 'Quantidade em estoque',
              example: 50
            },
            sku: {
              type: 'string',
              description: 'Código SKU',
              example: 'GALXY-S24-128'
            },
            categoryId: {
              type: 'integer',
              description: 'ID da categoria',
              example: 1
            },
            brandId: {
              type: 'integer',
              description: 'ID da marca',
              example: 1
            },
            weight: {
              type: 'number',
              description: 'Peso em gramas',
              example: 168
            }
          }
        },
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único do pedido'
            },
            orderNumber: {
              type: 'string',
              description: 'Número do pedido'
            },
            customerEmail: {
              type: 'string',
              description: 'Email do cliente'
            },
            customerName: {
              type: 'string',
              description: 'Nome do cliente'
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
              description: 'Status do pedido'
            },
            totalAmount: {
              type: 'number',
              format: 'decimal',
              description: 'Valor total do pedido'
            },
            paymentMethod: {
              type: 'string',
              description: 'Método de pagamento'
            },
            shippingMethod: {
              type: 'string',
              description: 'Método de envio'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação'
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/OrderItem'
              }
            }
          }
        },
        OrderItem: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID do item'
            },
            productId: {
              type: 'integer',
              description: 'ID do produto'
            },
            productName: {
              type: 'string',
              description: 'Nome do produto'
            },
            quantity: {
              type: 'integer',
              description: 'Quantidade'
            },
            unitPrice: {
              type: 'number',
              format: 'decimal',
              description: 'Preço unitário'
            },
            totalPrice: {
              type: 'number',
              format: 'decimal',
              description: 'Preço total do item'
            }
          }
        },
        Customer: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único do cliente'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email do cliente'
            },
            firstName: {
              type: 'string',
              description: 'Primeiro nome'
            },
            lastName: {
              type: 'string',
              description: 'Sobrenome'
            },
            phone: {
              type: 'string',
              description: 'Telefone'
            },
            birthDate: {
              type: 'string',
              format: 'date',
              description: 'Data de nascimento'
            },
            isActive: {
              type: 'boolean',
              description: 'Cliente ativo'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de cadastro'
            }
          }
        },
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID da categoria'
            },
            name: {
              type: 'string',
              description: 'Nome da categoria'
            },
            description: {
              type: 'string',
              description: 'Descrição da categoria'
            },
            parentId: {
              type: 'integer',
              description: 'ID da categoria pai'
            },
            isActive: {
              type: 'boolean',
              description: 'Categoria ativa'
            }
          }
        },
        Brand: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID da marca'
            },
            name: {
              type: 'string',
              description: 'Nome da marca'
            },
            description: {
              type: 'string',
              description: 'Descrição da marca'
            },
            website: {
              type: 'string',
              description: 'Website da marca'
            },
            isActive: {
              type: 'boolean',
              description: 'Marca ativa'
            }
          }
        },
        StockUpdate: {
          type: 'object',
          required: ['stock'],
          properties: {
            stock: {
              type: 'integer',
              minimum: 0,
              description: 'Nova quantidade em estoque'
            },
            operation: {
              type: 'string',
              enum: ['set', 'add', 'subtract'],
              default: 'set',
              description: 'Tipo de operação: set (definir), add (adicionar), subtract (subtrair)'
            }
          }
        },
        UpdateOrderStatus: {
          type: 'object',
          required: ['status'],
          properties: {
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
              description: 'Novo status do pedido'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Código do erro'
            },
            message: {
              type: 'string',
              description: 'Mensagem de erro'
            },
            details: {
              type: 'array',
              items: {
                type: 'object'
              },
              description: 'Detalhes do erro (quando aplicável)'
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              description: 'Página atual'
            },
            limit: {
              type: 'integer',
              description: 'Itens por página'
            },
            total: {
              type: 'integer',
              description: 'Total de itens'
            },
            pages: {
              type: 'integer',
              description: 'Total de páginas'
            }
          }
        },
        ApiInfo: {
          type: 'object',
          properties: {
            version: {
              type: 'string',
              description: 'Versão da API'
            },
            tenant_id: {
              type: 'integer',
              description: 'ID do tenant (loja)'
            },
            permissions: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Permissões da credencial'
            },
            rate_limit: {
              type: 'integer',
              description: 'Limite de requisições por hora'
            },
            endpoints: {
              type: 'object',
              description: 'Lista de endpoints disponíveis'
            }
          }
        }
      }
    },
    security: [
      {
        BearerAuth: []
      }
    ]
  },
  apis: ['./server/public-api.ts'], // Paths to files containing OpenAPI definitions
};

export const specs = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customSiteTitle: 'WikiStore API Documentation',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #0891b2 }
      .swagger-ui .scheme-container { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      docExpansion: 'list'
    }
  }));
}