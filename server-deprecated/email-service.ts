import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

export interface EmailNotification {
  to: string | string[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  from?: string;
}

export interface BulkEmailNotification {
  recipients: string[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  from?: string;
}

export async function sendSingleEmail(notification: EmailNotification): Promise<boolean> {
  try {
    await mailService.send({
      to: notification.to,
      from: notification.from || 'noreply@wikistore.com',
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

export async function sendBulkEmails(notification: BulkEmailNotification): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  // Process emails in batches of 10 to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < notification.recipients.length; i += batchSize) {
    const batch = notification.recipients.slice(i, i + batchSize);
    
    const emailPromises = batch.map(async (recipient) => {
      try {
        await mailService.send({
          to: recipient,
          from: notification.from || 'noreply@wikistore.com',
          subject: notification.subject,
          text: notification.textContent,
          html: notification.htmlContent,
        });
        return true;
      } catch (error) {
        console.error(`Failed to send email to ${recipient}:`, error);
        return false;
      }
    });

    const results = await Promise.all(emailPromises);
    success += results.filter(r => r).length;
    failed += results.filter(r => !r).length;

    // Add small delay between batches
    if (i + batchSize < notification.recipients.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return { success, failed };
}

// Template for user notifications
export function createNotificationTemplate(
  title: string,
  message: string,
  buttonText?: string,
  buttonUrl?: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; margin-top: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px; }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .content { padding: 20px 0; }
        .message { font-size: 16px; margin-bottom: 30px; }
        .button { display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; text-align: center; }
        .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">WikiStore</div>
          <h1>${title}</h1>
        </div>
        <div class="content">
          <div class="message">
            ${message.replace(/\n/g, '<br>')}
          </div>
          ${buttonText && buttonUrl ? `
            <div style="text-align: center;">
              <a href="${buttonUrl}" class="button">${buttonText}</a>
            </div>
          ` : ''}
        </div>
        <div class="footer">
          <p>Este e-mail foi enviado automaticamente pela plataforma WikiStore.</p>
          <p>Se você não deseja mais receber estes e-mails, entre em contato conosco.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}