import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { userSessions, cookieConsents } from '@shared/schema';
import { eq, and, gt } from 'drizzle-orm';

export interface SessionData {
  sessionId: string;
  tenantId?: number;
  cartData?: any;
  userData?: any;
  cookieConsent?: any;
}

export class SessionManager {
  private static COOKIE_NAME = 'session_id';
  private static SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

  static async getOrCreateSession(req: Request, res: Response): Promise<SessionData> {
    let sessionId = req.cookies?.[this.COOKIE_NAME];
    
    if (!sessionId) {
      // Create new session
      sessionId = uuidv4();
      this.setSessionCookie(res, sessionId);
      
      const expiresAt = new Date(Date.now() + this.SESSION_DURATION);
      
      await db.insert(userSessions).values({
        sessionId,
        tenantId: req.params.subdomain ? await this.getTenantIdFromSubdomain(req.params.subdomain) : undefined,
        ipAddress: this.getClientIP(req),
        userAgent: req.headers['user-agent'] || '',
        cartData: {},
        userData: {},
        cookieConsent: {},
        expiresAt,
        lastActivity: new Date(),
      });

      return { sessionId };
    }

    // Check if session exists and is valid
    const [session] = await db
      .select()
      .from(userSessions)
      .where(
        and(
          eq(userSessions.sessionId, sessionId),
          eq(userSessions.isActive, true)
        )
      );

    if (!session) {
      // Session expired or invalid, create new one
      return this.getOrCreateSession(req, res);
    }

    // Update last activity
    await db
      .update(userSessions)
      .set({ lastActivity: new Date() })
      .where(eq(userSessions.sessionId, sessionId));

    return {
      sessionId: session.sessionId,
      tenantId: session.tenantId || undefined,
      cartData: session.cartData,
      userData: session.userData,
      cookieConsent: session.cookieConsent,
    };
  }

  static async updateSessionData(sessionId: string, data: Partial<SessionData>): Promise<void> {
    const updateData: any = {};
    
    if (data.cartData !== undefined) updateData.cartData = data.cartData;
    if (data.userData !== undefined) updateData.userData = data.userData;
    if (data.cookieConsent !== undefined) updateData.cookieConsent = data.cookieConsent;
    if (data.tenantId !== undefined) updateData.tenantId = data.tenantId;

    if (Object.keys(updateData).length > 0) {
      updateData.lastActivity = new Date();
      
      await db
        .update(userSessions)
        .set(updateData)
        .where(eq(userSessions.sessionId, sessionId));
    }
  }

  static async saveCookieConsent(sessionId: string, tenantId: number, consent: {
    consentGiven: boolean;
    consentTypes: any;
    ipAddress: string;
    userAgent: string;
  }): Promise<void> {
    await db.insert(cookieConsents).values({
      sessionId,
      tenantId,
      consentGiven: consent.consentGiven,
      consentTypes: consent.consentTypes,
      ipAddress: consent.ipAddress,
      userAgent: consent.userAgent,
      consentDate: new Date(),
    });

    // Update session with consent data
    await this.updateSessionData(sessionId, {
      cookieConsent: consent.consentTypes,
    });
  }

  static async cleanupExpiredSessions(): Promise<void> {
    await db
      .update(userSessions)
      .set({ isActive: false })
      .where(gt(new Date(), userSessions.expiresAt));
  }

  private static setSessionCookie(res: Response, sessionId: string): void {
    res.cookie(this.COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: this.SESSION_DURATION,
      path: '/',
    });
  }

  private static getClientIP(req: Request): string {
    return (
      req.headers['x-forwarded-for'] as string ||
      req.headers['x-real-ip'] as string ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      '127.0.0.1'
    ).split(',')[0].trim();
  }

  private static async getTenantIdFromSubdomain(subdomain: string): Promise<number | undefined> {
    // This would need to be implemented based on your tenant lookup logic
    // For now, return undefined
    return undefined;
  }
}

// Middleware to add session to all requests
export function sessionMiddleware(req: Request & { session?: SessionData }, res: Response, next: NextFunction): void {
  // Skip session for API routes that don't need it
  if (req.path.startsWith('/api/') && !req.path.includes('/session') && !req.path.includes('/cookie-consent')) {
    return next();
  }

  SessionManager.getOrCreateSession(req, res)
    .then(session => {
      req.session = session;
      next();
    })
    .catch(next);
}