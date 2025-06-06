import { Injectable } from '@nestjs/common';
import { MailService } from '@sendgrid/mail';

export interface EmailNotification {
  to: string | string[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  from?: string;
}

@Injectable()
export class EmailService {
  private mailService: MailService;

  constructor() {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error("SENDGRID_API_KEY environment variable must be set");
    }

    this.mailService = new MailService();
    this.mailService.setApiKey(process.env.SENDGRID_API_KEY);
  }

  async sendSingleEmail(notification: EmailNotification): Promise<boolean> {
    try {
      await this.mailService.send({
        to: notification.to,
        from: notification.from || 'noreply@wikistore.com.br',
        subject: notification.subject,
        text: notification.textContent,
        html: notification.htmlContent,
      });
      return true;
    } catch (error) {
      console.error('SendGrid email error:', error);
      return false;
    }
  }

  async sendBulkEmails(notifications: EmailNotification[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const notification of notifications) {
      const result = await this.sendSingleEmail(notification);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }

  createNotificationTemplate(
    type: 'order_confirmation' | 'order_shipped' | 'payment_received' | 'account_created',
    data: any
  ): { subject: string; htmlContent: string; textContent: string } {
    switch (type) {
      case 'order_confirmation':
        return {
          subject: `Pedido Confirmado - #${data.orderId}`,
          htmlContent: `
            <h2>Pedido Confirmado!</h2>
            <p>Olá ${data.customerName},</p>
            <p>Seu pedido #${data.orderId} foi confirmado com sucesso.</p>
            <p>Total: R$ ${data.total}</p>
            <p>Obrigado por comprar conosco!</p>
          `,
          textContent: `Pedido #${data.orderId} confirmado. Total: R$ ${data.total}`
        };
      
      case 'order_shipped':
        return {
          subject: `Pedido Enviado - #${data.orderId}`,
          htmlContent: `
            <h2>Pedido Enviado!</h2>
            <p>Olá ${data.customerName},</p>
            <p>Seu pedido #${data.orderId} foi enviado.</p>
            <p>Código de rastreamento: ${data.trackingCode}</p>
          `,
          textContent: `Pedido #${data.orderId} enviado. Rastreamento: ${data.trackingCode}`
        };
      
      default:
        return {
          subject: 'Notificação',
          htmlContent: '<p>Você recebeu uma notificação.</p>',
          textContent: 'Você recebeu uma notificação.'
        };
    }
  }
}