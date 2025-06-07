import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminService {
  constructor() {}

  async getTenants() {
    // Mock data for admin dashboard - frontend expects this structure
    return [
      {
        id: 1,
        name: 'E-commerce Demo',
        slug: 'ecommerce-demo',
        domain: 'demo.ecommerce.com',
        subdomain: 'demo',
        description: 'Loja de demonstração do sistema',
        logo: '/api/placeholder/40/40',
        theme: { primaryColor: '#3b82f6', secondaryColor: '#ef4444' },
        isActive: true,
        settings: { allowRegistration: true, enableNotifications: true },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
        _count: { orders: 156, products: 89, users: 23 }
      },
      {
        id: 2,
        name: 'Fashion Store',
        slug: 'fashion-store',
        domain: 'fashion.store.com',
        subdomain: 'fashion',
        description: 'Loja de moda e acessórios',
        logo: '/api/placeholder/40/40',
        theme: { primaryColor: '#ec4899', secondaryColor: '#8b5cf6' },
        isActive: true,
        settings: { allowRegistration: true, enableNotifications: false },
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date(),
        _count: { orders: 89, products: 156, users: 45 }
      }
    ];
  }

  async getUsers() {
    return [
      {
        id: 1,
        email: 'admin@exemplo.com',
        firstName: 'Admin',
        lastName: 'Sistema',
        role: 'admin',
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date('2024-01-01'),
        tenantId: 1
      },
      {
        id: 2,
        email: 'merchant@exemplo.com',
        firstName: 'João',
        lastName: 'Silva',
        role: 'merchant',
        isActive: true,
        lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        createdAt: new Date('2024-01-15'),
        tenantId: 1
      }
    ];
  }

  async getSystemMetrics() {
    return {
      cpuUsage: Math.floor(Math.random() * 30) + 20, // 20-50%
      memoryUsage: Math.floor(Math.random() * 40) + 30, // 30-70%
      diskUsage: Math.floor(Math.random() * 20) + 40, // 40-60%
      networkIO: {
        incoming: Math.floor(Math.random() * 100) + 50,
        outgoing: Math.floor(Math.random() * 80) + 30
      },
      activeConnections: Math.floor(Math.random() * 500) + 100,
      responseTime: Math.floor(Math.random() * 50) + 25,
      uptime: '15 days, 8 hours, 23 minutes'
    };
  }

  async getSystemStatus() {
    return {
      database: { status: 'healthy', responseTime: 12, connections: 45 },
      redis: { status: 'healthy', responseTime: 3, memory: '2.1GB' },
      celcoin: { status: 'healthy', responseTime: 156, lastCheck: new Date() },
      email: { status: 'healthy', queued: 3, sent24h: 245 },
      storage: { status: 'healthy', usage: '45%', available: '2.1TB' },
      api: { status: 'healthy', requestsPerMinute: 156, errors: 2 }
    };
  }

  async getDatabasePerformance() {
    return {
      slowQueries: [
        { query: 'SELECT * FROM orders WHERE...', duration: 1250, executions: 45 },
        { query: 'SELECT COUNT(*) FROM products...', duration: 890, executions: 78 }
      ],
      queryStats: {
        totalQueries: 15420,
        avgResponseTime: 45,
        slowestQuery: 1250,
        fastestQuery: 2
      },
      indexUsage: {
        used: 156,
        unused: 12,
        missingIndexes: 3
      },
      connectionPool: {
        active: 45,
        idle: 15,
        total: 60,
        maxConnections: 100
      }
    };
  }

  async getApiAnalytics() {
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date();
      hour.setHours(hour.getHours() - i);
      return {
        hour: hour.toISOString(),
        requests: Math.floor(Math.random() * 500) + 100,
        errors: Math.floor(Math.random() * 20),
        avgResponseTime: Math.floor(Math.random() * 100) + 50
      };
    }).reverse();

    return {
      hourlyMetrics: hours,
      endpointStats: [
        { endpoint: '/api/products', requests: 2456, successful: 2440, avgResponseTime: 45 },
        { endpoint: '/api/orders', requests: 1890, successful: 1875, avgResponseTime: 78 },
        { endpoint: '/api/payments/pix', requests: 890, successful: 885, avgResponseTime: 156 },
        { endpoint: '/api/checkout/create', requests: 567, successful: 562, avgResponseTime: 234 }
      ],
      errorAnalysis: [
        { status: 'failed', count: 45, percentage: 2.3 },
        { status: 'cancelled', count: 23, percentage: 1.2 },
        { status: 'pending', count: 12, percentage: 0.6 }
      ]
    };
  }

  async getSecurityLogs() {
    return [
      {
        id: 'login_admin_2024',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        eventType: 'successful_login',
        description: 'Successful login from 192.168.1.100',
        severity: 'low',
        user: 'admin@exemplo.com',
        ipAddress: '192.168.1.100'
      },
      {
        id: 'failed_login_2024',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        eventType: 'failed_login',
        description: 'Failed login attempt from 203.0.113.0',
        severity: 'high',
        user: 'unknown@attacker.com',
        ipAddress: '203.0.113.0'
      },
      {
        id: 'payment_failure_2024',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        eventType: 'payment_failure',
        description: 'Payment failure - Order #156 (R$ 299.90)',
        severity: 'medium',
        user: 'system',
        ipAddress: 'system'
      }
    ];
  }

  async getPlugins() {
    return [
      {
        id: 1,
        name: 'Integração Celcoin',
        description: 'Processamento de pagamentos PIX e Boleto',
        version: '1.2.0',
        author: 'Sistema',
        isActive: true,
        category: 'payment',
        settings: { apiKey: '***', environment: 'production' }
      },
      {
        id: 2,
        name: 'NFe Eletrônica',
        description: 'Geração automática de notas fiscais eletrônicas',
        version: '2.1.0',
        author: 'Sistema',
        isActive: true,
        category: 'fiscal',
        settings: { certificateValid: true, environment: 'production' }
      },
      {
        id: 3,
        name: 'Email Marketing',
        description: 'Campanhas de email automatizadas',
        version: '1.0.5',
        author: 'Sistema',
        isActive: false,
        category: 'marketing',
        settings: { provider: 'sendgrid', dailyLimit: 1000 }
      }
    ];
  }

  async getReports() {
    return {
      salesReport: {
        totalSales: 2456789.50,
        salesGrowth: 12.5,
        orderCount: 1567,
        averageOrder: 1567.89,
        topProducts: [
          { name: 'Smartphone Galaxy', sales: 45, revenue: 58499.55 },
          { name: 'Notebook Lenovo', sales: 23, revenue: 57497.70 }
        ]
      },
      customerReport: {
        totalCustomers: 2345,
        newCustomers: 156,
        customerGrowth: 8.7,
        retention: 78.5,
        topCustomers: [
          { name: 'João Silva', orders: 12, total: 5678.90 },
          { name: 'Maria Santos', orders: 8, total: 4321.00 }
        ]
      },
      financialReport: {
        revenue: 1234567.89,
        expenses: 456789.12,
        profit: 777778.77,
        profitMargin: 63.0,
        taxes: 123456.78
      }
    };
  }

  async getNotifications() {
    return [
      {
        id: 1,
        title: 'Novo pedido recebido',
        message: 'Pedido #1567 - R$ 299,90 - João Silva',
        type: 'order',
        priority: 'normal',
        read: false,
        createdAt: new Date(Date.now() - 5 * 60 * 1000)
      },
      {
        id: 2,
        title: 'Falha no pagamento',
        message: 'Pagamento PIX rejeitado - Pedido #1566',
        type: 'payment',
        priority: 'high',
        read: false,
        createdAt: new Date(Date.now() - 15 * 60 * 1000)
      },
      {
        id: 3,
        title: 'Estoque baixo',
        message: 'Produto "Smartphone Galaxy" com apenas 5 unidades',
        type: 'stock',
        priority: 'medium',
        read: true,
        createdAt: new Date(Date.now() - 60 * 60 * 1000)
      }
    ];
  }
}