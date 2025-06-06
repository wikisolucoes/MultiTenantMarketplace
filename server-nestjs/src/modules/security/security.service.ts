import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { EmailService } from '../email/email.service';

@Injectable()
export class SecurityService {
  constructor(private emailService: EmailService) {}

  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  async generate2FASecret(email: string, storeName: string) {
    const secret = speakeasy.generateSecret({
      name: `${storeName} (${email})`,
      issuer: 'WikiStore'
    });

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32
    };
  }

  verify2FAToken(token: string, secret: string): boolean {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2
    });
  }

  generateBackupCodes(count: number = 8): string[] {
    const codes = [];
    for (let i = 0; i < count; i++) {
      codes.push(this.generateSecureToken(4).toUpperCase());
    }
    return codes;
  }

  async sendSecurityAlert(
    email: string,
    type: 'login_attempt' | 'password_change' | 'suspicious_activity',
    details: any
  ): Promise<boolean> {
    const templates = {
      login_attempt: {
        subject: 'Alerta de Segurança - Nova tentativa de login',
        html: `
          <h2>Nova tentativa de login detectada</h2>
          <p>Detectamos uma tentativa de login em sua conta:</p>
          <ul>
            <li>IP: ${details.ip}</li>
            <li>Localização: ${details.location}</li>
            <li>Data/Hora: ${details.timestamp}</li>
            <li>Dispositivo: ${details.userAgent}</li>
          </ul>
          <p>Se não foi você, recomendamos alterar sua senha imediatamente.</p>
        `
      },
      password_change: {
        subject: 'Senha alterada com sucesso',
        html: `
          <h2>Senha alterada</h2>
          <p>Sua senha foi alterada com sucesso em ${details.timestamp}.</p>
          <p>Se você não fez esta alteração, entre em contato conosco imediatamente.</p>
        `
      },
      suspicious_activity: {
        subject: 'Atividade suspeita detectada',
        html: `
          <h2>Atividade suspeita</h2>
          <p>Detectamos atividade suspeita em sua conta:</p>
          <p>${details.description}</p>
          <p>Recomendamos revisar sua conta e alterar sua senha.</p>
        `
      }
    };

    const template = templates[type];
    return await this.emailService.sendSingleEmail({
      to: email,
      subject: template.subject,
      htmlContent: template.html
    });
  }

  checkRateLimit(
    identifier: string,
    maxAttempts: number,
    windowMs: number,
    storage: Map<string, { count: number; resetTime: number }>
  ): boolean {
    const now = Date.now();
    const record = storage.get(identifier);

    if (!record || now > record.resetTime) {
      storage.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (record.count >= maxAttempts) {
      return false;
    }

    record.count++;
    return true;
  }

  generateDeviceFingerprint(req: any): string {
    const fingerprint = crypto
      .createHash('sha256')
      .update(req.headers['user-agent'] || '')
      .update(req.headers['accept-language'] || '')
      .update(req.headers['accept-encoding'] || '')
      .digest('hex');
    
    return fingerprint;
  }

  detectSuspiciousActivity(
    userId: number,
    activity: {
      ip: string;
      userAgent: string;
      action: string;
      timestamp: Date;
    },
    recentActivities: any[]
  ): { suspicious: boolean; reasons: string[] } {
    const reasons = [];
    let suspicious = false;

    // Check for multiple IPs in short time
    const recentIps = recentActivities
      .filter(a => Date.now() - new Date(a.timestamp).getTime() < 3600000) // 1 hour
      .map(a => a.ip);
    
    const uniqueIps = new Set(recentIps);
    if (uniqueIps.size > 3) {
      reasons.push('Multiple IPs detected in short timeframe');
      suspicious = true;
    }

    // Check for unusual login times
    const hour = activity.timestamp.getHours();
    if (hour < 6 || hour > 22) {
      const usualHours = recentActivities
        .map(a => new Date(a.timestamp).getHours())
        .filter(h => h >= 6 && h <= 22);
      
      if (usualHours.length > 10) {
        reasons.push('Login at unusual time');
        suspicious = true;
      }
    }

    // Check for rapid successive attempts
    const recentAttempts = recentActivities
      .filter(a => Date.now() - new Date(a.timestamp).getTime() < 300000) // 5 minutes
      .length;
    
    if (recentAttempts > 5) {
      reasons.push('Too many attempts in short time');
      suspicious = true;
    }

    return { suspicious, reasons };
  }

  validatePasswordStrength(password: string): { 
    valid: boolean; 
    score: number; 
    feedback: string[] 
  } {
    const feedback = [];
    let score = 0;

    if (password.length < 8) {
      feedback.push('Senha deve ter pelo menos 8 caracteres');
    } else {
      score += 1;
    }

    if (!/[a-z]/.test(password)) {
      feedback.push('Deve conter pelo menos uma letra minúscula');
    } else {
      score += 1;
    }

    if (!/[A-Z]/.test(password)) {
      feedback.push('Deve conter pelo menos uma letra maiúscula');
    } else {
      score += 1;
    }

    if (!/\d/.test(password)) {
      feedback.push('Deve conter pelo menos um número');
    } else {
      score += 1;
    }

    if (!/[!@#$%^&*]/.test(password)) {
      feedback.push('Deve conter pelo menos um caractere especial');
    } else {
      score += 1;
    }

    return {
      valid: score >= 4,
      score,
      feedback
    };
  }
}