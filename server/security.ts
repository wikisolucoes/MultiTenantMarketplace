import speakeasy from "speakeasy";
import QRCode from "qrcode";
import crypto from "crypto";
import nodemailer from "nodemailer";

// Email configuration
const createEmailTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("Email configuration missing. Email features will not work.");
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Generate secure random tokens
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString("hex");
};

// Generate 2FA secret and QR code
export const generate2FASecret = async (email: string, storeName: string) => {
  const secret = speakeasy.generateSecret({
    name: `${storeName} (${email})`,
    issuer: storeName,
    length: 32,
  });

  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

  return {
    secret: secret.base32,
    qrCode: qrCodeUrl,
    manualEntryKey: secret.base32,
  };
};

// Verify 2FA token
export const verify2FAToken = (token: string, secret: string): boolean => {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: "base32",
    token: token,
    window: 1, // Allow 1 step tolerance
  });
};

// Generate backup codes for 2FA
export const generateBackupCodes = (count: number = 8): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(crypto.randomBytes(4).toString("hex").toUpperCase());
  }
  return codes;
};

// Email templates
const getEmailTemplate = (type: string, data: any) => {
  const baseUrl = process.env.BASE_URL || "https://localhost:5000";
  
  switch (type) {
    case "email_verification":
      return {
        subject: `Verifique seu email - ${data.storeName}`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: linear-gradient(135deg, #0891b2 0%, #0d9488 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">${data.storeName}</h1>
            </div>
            <div style="padding: 40px 20px; background: #f8fafc;">
              <h2 style="color: #1e293b; margin-bottom: 20px;">Confirme seu email</h2>
              <p style="color: #475569; line-height: 1.6; margin-bottom: 30px;">
                Olá ${data.firstName},<br><br>
                Obrigado por se cadastrar em nossa loja! Para concluir seu cadastro, 
                clique no botão abaixo para verificar seu email:
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}/api/storefront/${data.subdomain}/auth/verify-email?token=${data.token}" 
                   style="background: #0891b2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  Verificar Email
                </a>
              </div>
              <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
                Se você não criou esta conta, pode ignorar este email com segurança.
              </p>
            </div>
          </div>
        `,
      };

    case "password_reset":
      return {
        subject: `Redefinir senha - ${data.storeName}`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: linear-gradient(135deg, #0891b2 0%, #0d9488 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">${data.storeName}</h1>
            </div>
            <div style="padding: 40px 20px; background: #f8fafc;">
              <h2 style="color: #1e293b; margin-bottom: 20px;">Redefinir sua senha</h2>
              <p style="color: #475569; line-height: 1.6; margin-bottom: 30px;">
                Olá ${data.firstName},<br><br>
                Recebemos uma solicitação para redefinir a senha da sua conta. 
                Clique no botão abaixo para criar uma nova senha:
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}/storefront/${data.subdomain}/reset-password?token=${data.token}" 
                   style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  Redefinir Senha
                </a>
              </div>
              <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
                Este link expira em 1 hora. Se você não solicitou a redefinição de senha, ignore este email.
              </p>
            </div>
          </div>
        `,
      };

    case "2fa_enabled":
      return {
        subject: `Autenticação de dois fatores ativada - ${data.storeName}`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: linear-gradient(135deg, #0891b2 0%, #0d9488 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">${data.storeName}</h1>
            </div>
            <div style="padding: 40px 20px; background: #f8fafc;">
              <h2 style="color: #1e293b; margin-bottom: 20px;">2FA Ativado com Sucesso</h2>
              <p style="color: #475569; line-height: 1.6; margin-bottom: 30px;">
                Olá ${data.firstName},<br><br>
                A autenticação de dois fatores foi ativada em sua conta com sucesso. 
                Sua conta agora está mais segura!
              </p>
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
                <h3 style="color: #92400e; margin: 0 0 10px 0;">Códigos de Backup:</h3>
                <p style="color: #92400e; margin: 0; font-family: monospace;">
                  ${data.backupCodes.join(" • ")}
                </p>
                <p style="color: #92400e; font-size: 14px; margin-top: 10px;">
                  Guarde estes códigos em local seguro. Use-os se não conseguir acessar seu app autenticador.
                </p>
              </div>
            </div>
          </div>
        `,
      };

    default:
      return null;
  }
};

// Send email function
export const sendEmail = async (
  to: string,
  type: string,
  data: any
): Promise<boolean> => {
  const transporter = createEmailTransporter();
  
  if (!transporter) {
    console.warn(`Email not sent to ${to}: SMTP not configured`);
    return false;
  }

  const template = getEmailTemplate(type, data);
  if (!template) {
    console.error(`Unknown email template: ${type}`);
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: to,
      subject: template.subject,
      html: template.html,
    });

    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    return false;
  }
};

// Rate limiting for security actions
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean => {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxAttempts) {
    return false;
  }

  record.count++;
  return true;
};

// Generate device fingerprint
export const generateDeviceFingerprint = (req: any): string => {
  const userAgent = req.headers["user-agent"] || "";
  const acceptLanguage = req.headers["accept-language"] || "";
  const acceptEncoding = req.headers["accept-encoding"] || "";
  const ip = req.ip || req.connection.remoteAddress || "";

  const fingerprint = crypto
    .createHash("sha256")
    .update(userAgent + acceptLanguage + acceptEncoding + ip)
    .digest("hex");

  return fingerprint.substring(0, 16);
};

// Detect suspicious activity
export const detectSuspiciousActivity = (
  customer: any,
  req: any
): { suspicious: boolean; reason?: string } => {
  const currentIp = req.ip || req.connection.remoteAddress;
  const lastLoginIp = customer.lastLoginIp;

  // Check for IP change (simple geo-location check would be better)
  if (lastLoginIp && lastLoginIp !== currentIp) {
    return { suspicious: true, reason: "Login from new IP address" };
  }

  // Check for too many failed attempts
  if (customer.failedLoginAttempts >= 3) {
    return { suspicious: true, reason: "Multiple failed login attempts" };
  }

  return { suspicious: false };
};