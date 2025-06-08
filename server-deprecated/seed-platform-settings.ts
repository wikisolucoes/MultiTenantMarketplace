import { db } from "./db";
import { platformSettings, platformFeatures, platformMaintenance } from "@shared/schema";

export async function seedPlatformSettings() {
  try {
    console.log("🌱 Seeding platform settings...");

    // General Settings
    const generalSettings = [
      {
        category: 'general',
        key: 'platform_name',
        value: 'WikiStore E-commerce Platform',
        dataType: 'string',
        isPublic: true,
        description: 'Nome da plataforma exibido publicamente'
      },
      {
        category: 'general',
        key: 'platform_description',
        value: 'Plataforma SaaS multi-tenant de e-commerce especializada no mercado brasileiro',
        dataType: 'string',
        isPublic: true,
        description: 'Descrição da plataforma'
      },
      {
        category: 'general',
        key: 'max_tenants_per_plan',
        value: '1000',
        dataType: 'number',
        isPublic: false,
        description: 'Número máximo de tenants por plano'
      },
      {
        category: 'general',
        key: 'maintenance_mode',
        value: 'false',
        dataType: 'boolean',
        isPublic: true,
        description: 'Modo de manutenção da plataforma'
      }
    ];

    // Email Settings
    const emailSettings = [
      {
        category: 'email',
        key: 'smtp_host',
        value: 'smtp.sendgrid.net',
        dataType: 'string',
        isPublic: false,
        description: 'Servidor SMTP para envio de emails'
      },
      {
        category: 'email',
        key: 'smtp_port',
        value: '587',
        dataType: 'number',
        isPublic: false,
        description: 'Porta do servidor SMTP'
      },
      {
        category: 'email',
        key: 'default_from_email',
        value: 'noreply@wikistore.com.br',
        dataType: 'string',
        isPublic: false,
        description: 'Email padrão para envio'
      },
      {
        category: 'email',
        key: 'email_rate_limit',
        value: '100',
        dataType: 'number',
        isPublic: false,
        description: 'Limite de emails por hora por tenant'
      }
    ];

    // Payment Settings
    const paymentSettings = [
      {
        category: 'payment',
        key: 'celcoin_integration',
        value: 'true',
        dataType: 'boolean',
        isPublic: false,
        description: 'Integração com Celcoin habilitada'
      },
      {
        category: 'payment',
        key: 'payment_processing_fee',
        value: '2.9',
        dataType: 'number',
        isPublic: false,
        description: 'Taxa de processamento de pagamentos (%)'
      },
      {
        category: 'payment',
        key: 'supported_payment_methods',
        value: JSON.stringify(['pix', 'boleto', 'credit_card', 'debit_card']),
        dataType: 'json',
        isPublic: true,
        description: 'Métodos de pagamento suportados'
      }
    ];

    // Security Settings
    const securitySettings = [
      {
        category: 'security',
        key: 'session_timeout',
        value: '3600',
        dataType: 'number',
        isPublic: false,
        description: 'Tempo limite da sessão em segundos'
      },
      {
        category: 'security',
        key: 'max_login_attempts',
        value: '5',
        dataType: 'number',
        isPublic: false,
        description: 'Máximo de tentativas de login antes do bloqueio'
      },
      {
        category: 'security',
        key: 'password_min_length',
        value: '8',
        dataType: 'number',
        isPublic: true,
        description: 'Comprimento mínimo da senha'
      },
      {
        category: 'security',
        key: 'require_2fa',
        value: 'false',
        dataType: 'boolean',
        isPublic: false,
        description: 'Exigir autenticação de dois fatores'
      }
    ];

    // Tax Configuration
    const taxSettings = [
      {
        category: 'tax',
        key: 'default_icms_rate',
        value: '18.0',
        dataType: 'number',
        isPublic: false,
        description: 'Alíquota padrão do ICMS (%)'
      },
      {
        category: 'tax',
        key: 'default_ipi_rate',
        value: '5.0',
        dataType: 'number',
        isPublic: false,
        description: 'Alíquota padrão do IPI (%)'
      },
      {
        category: 'tax',
        key: 'default_pis_rate',
        value: '1.65',
        dataType: 'number',
        isPublic: false,
        description: 'Alíquota padrão do PIS (%)'
      },
      {
        category: 'tax',
        key: 'default_cofins_rate',
        value: '7.6',
        dataType: 'number',
        isPublic: false,
        description: 'Alíquota padrão do COFINS (%)'
      }
    ];

    // Integration Settings
    const integrationSettings = [
      {
        category: 'integrations',
        key: 'mercadolivre_enabled',
        value: 'true',
        dataType: 'boolean',
        isPublic: false,
        description: 'Integração com Mercado Livre habilitada'
      },
      {
        category: 'integrations',
        key: 'shopee_enabled',
        value: 'true',
        dataType: 'boolean',
        isPublic: false,
        description: 'Integração com Shopee habilitada'
      },
      {
        category: 'integrations',
        key: 'amazon_enabled',
        value: 'false',
        dataType: 'boolean',
        isPublic: false,
        description: 'Integração com Amazon habilitada'
      }
    ];

    // Notification Settings
    const notificationSettings = [
      {
        category: 'notification',
        key: 'email_notifications',
        value: 'true',
        dataType: 'boolean',
        isPublic: false,
        description: 'Notificações por email habilitadas'
      },
      {
        category: 'notification',
        key: 'sms_notifications',
        value: 'false',
        dataType: 'boolean',
        isPublic: false,
        description: 'Notificações por SMS habilitadas'
      },
      {
        category: 'notification',
        key: 'push_notifications',
        value: 'true',
        dataType: 'boolean',
        isPublic: false,
        description: 'Notificações push habilitadas'
      }
    ];

    // Insert all settings
    const allSettings = [
      ...generalSettings,
      ...emailSettings,
      ...paymentSettings,
      ...securitySettings,
      ...taxSettings,
      ...integrationSettings,
      ...notificationSettings
    ];

    for (const setting of allSettings) {
      await db.insert(platformSettings).values(setting).onConflictDoNothing();
    }

    // Seed Platform Features
    const features = [
      {
        name: 'marketplace_integrations',
        description: 'Integrações com marketplaces (Mercado Livre, Shopee, Amazon)',
        isEnabled: true,
        rolloutPercentage: 100,
        metadata: JSON.stringify({ priority: 'high' })
      },
      {
        name: 'advanced_analytics',
        description: 'Analytics avançado com relatórios personalizados',
        isEnabled: true,
        rolloutPercentage: 80,
        metadata: JSON.stringify({ priority: 'medium' })
      },
      {
        name: 'ai_recommendations',
        description: 'Recomendações baseadas em IA',
        isEnabled: false,
        rolloutPercentage: 0,
        metadata: JSON.stringify({ priority: 'low', beta: true })
      },
      {
        name: 'multi_currency',
        description: 'Suporte a múltiplas moedas',
        isEnabled: false,
        rolloutPercentage: 0,
        metadata: JSON.stringify({ priority: 'medium' })
      }
    ];

    for (const feature of features) {
      await db.insert(platformFeatures).values(feature).onConflictDoNothing();
    }

    console.log("✅ Platform settings seeded successfully");

  } catch (error) {
    console.error("❌ Error seeding platform settings:", error);
    throw error;
  }
}