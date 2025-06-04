import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

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
  private static sessions: Map<string, SessionData & { expiresAt: Date; lastActivity: Date }> = new Map();

  static async getOrCreateSession(req: Request, res: Response): Promise<SessionData> {
    let sessionId = req.cookies?.[this.COOKIE_NAME];
    
    // Helper function to create new session
    const createNewSession = () => {
      const newSessionId = uuidv4();
      this.setSessionCookie(res, newSessionId);
      
      const sessionData = {
        sessionId: newSessionId,
        tenantId: undefined,
        cartData: {},
        userData: {},
        cookieConsent: {},
        expiresAt: new Date(Date.now() + this.SESSION_DURATION),
        lastActivity: new Date(),
      };
      
      this.sessions.set(newSessionId, sessionData);
      return { sessionId: newSessionId };
    };
    
    if (!sessionId) {
      return createNewSession();
    }

    // Check if session exists and is valid
    const session = this.sessions.get(sessionId);

    if (!session || session.expiresAt < new Date()) {
      // Session expired or invalid, create new one
      if (sessionId) {
        this.sessions.delete(sessionId);
      }
      return createNewSession();
    }

    // Update last activity
    session.lastActivity = new Date();
    this.sessions.set(sessionId, session);

    return {
      sessionId: session.sessionId,
      tenantId: session.tenantId,
      cartData: session.cartData,
      userData: session.userData,
      cookieConsent: session.cookieConsent,
    };
  }

  static async updateSessionData(sessionId: string, data: Partial<SessionData>): Promise<void> {
    const session = this.sessions.get(sessionId);
    
    if (!session) return;

    if (data.cartData !== undefined) session.cartData = data.cartData;
    if (data.userData !== undefined) session.userData = data.userData;
    if (data.cookieConsent !== undefined) session.cookieConsent = data.cookieConsent;
    if (data.tenantId !== undefined) session.tenantId = data.tenantId;

    session.lastActivity = new Date();
    this.sessions.set(sessionId, session);
  }

  static async saveCookieConsent(sessionId: string, tenantId: number, consent: {
    consentGiven: boolean;
    consentTypes: any;
    ipAddress: string;
    userAgent: string;
  }): Promise<void> {
    // Store consent data in session for now
    await this.updateSessionData(sessionId, {
      cookieConsent: consent.consentTypes,
    });
  }

  static async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(sessionId);
      }
    }
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