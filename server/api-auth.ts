import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { apiCredentials, apiUsageLogs } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export interface AuthenticatedApiRequest extends Request {
  apiCredential?: {
    id: number;
    tenantId: number;
    userId: number;
    permissions: string[];
    rateLimit: number;
  };
}

// Generate secure API key and secret
export function generateApiCredentials() {
  const apiKey = `wks_${crypto.randomBytes(20).toString('hex')}`;
  const apiSecret = crypto.randomBytes(32).toString('hex');
  const hashedSecret = bcrypt.hashSync(apiSecret, 12);
  
  return { apiKey, apiSecret, hashedSecret };
}

// Rate limiting check
const rateLimitCache = new Map<number, { count: number; resetTime: number }>();

function checkRateLimit(credentialId: number, rateLimit: number): boolean {
  const now = Date.now();
  const key = credentialId;
  const cached = rateLimitCache.get(key);
  
  if (!cached || now > cached.resetTime) {
    rateLimitCache.set(key, { count: 1, resetTime: now + 3600000 }); // 1 hour
    return true;
  }
  
  if (cached.count >= rateLimit) {
    return false;
  }
  
  cached.count++;
  return true;
}

// Authentication middleware for public API
export async function authenticateApi(
  req: AuthenticatedApiRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'API key required. Use Authorization: Bearer <api_key>:<api_secret>'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    const [apiKey, apiSecret] = token.split(':');

    if (!apiKey || !apiSecret) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid API credentials format. Use api_key:api_secret'
      });
    }

    // Find credential by API key
    const [credential] = await db
      .select()
      .from(apiCredentials)
      .where(and(
        eq(apiCredentials.apiKey, apiKey),
        eq(apiCredentials.isActive, true)
      ));

    if (!credential) {
      return res.status(401).json({
        error: 'INVALID_API_KEY',
        message: 'Invalid API key'
      });
    }

    // Check if expired
    if (credential.expiresAt && new Date() > credential.expiresAt) {
      return res.status(401).json({
        error: 'EXPIRED_CREDENTIALS',
        message: 'API credentials have expired'
      });
    }

    // Verify secret
    const isValidSecret = bcrypt.compareSync(apiSecret, credential.apiSecret);
    if (!isValidSecret) {
      return res.status(401).json({
        error: 'INVALID_SECRET',
        message: 'Invalid API secret'
      });
    }

    // Check rate limit
    if (!checkRateLimit(credential.id, credential.rateLimit)) {
      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: `Rate limit of ${credential.rateLimit} requests per hour exceeded`
      });
    }

    // Update last used timestamp
    await db
      .update(apiCredentials)
      .set({ lastUsed: new Date() })
      .where(eq(apiCredentials.id, credential.id));

    // Attach credential info to request
    req.apiCredential = {
      id: credential.id,
      tenantId: credential.tenantId,
      userId: credential.userId,
      permissions: credential.permissions as string[],
      rateLimit: credential.rateLimit
    };

    next();
  } catch (error) {
    console.error('API authentication error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Authentication failed'
    });
  }
}

// Permission check middleware
export function requirePermission(permission: string) {
  return (req: AuthenticatedApiRequest, res: Response, next: NextFunction) => {
    if (!req.apiCredential) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
    }

    if (!req.apiCredential.permissions.includes(permission) && 
        !req.apiCredential.permissions.includes('*')) {
      return res.status(403).json({
        error: 'INSUFFICIENT_PERMISSIONS',
        message: `Permission '${permission}' required`
      });
    }

    next();
  };
}

// Log API usage
export async function logApiUsage(
  req: AuthenticatedApiRequest,
  res: Response,
  next: NextFunction
) {
  const startTime = Date.now();
  
  // Override res.end to capture response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const responseTime = Date.now() - startTime;
    
    // Log usage asynchronously
    if (req.apiCredential) {
      setImmediate(async () => {
        try {
          await db.insert(apiUsageLogs).values({
            credentialId: req.apiCredential!.id,
            tenantId: req.apiCredential!.tenantId,
            endpoint: req.path,
            method: req.method,
            statusCode: res.statusCode,
            responseTime,
            userAgent: req.headers['user-agent'] || null,
            ipAddress: req.ip || req.connection.remoteAddress || null,
            requestSize: JSON.stringify(req.body || {}).length,
            responseSize: chunk ? chunk.length : 0
          });
        } catch (error) {
          console.error('Failed to log API usage:', error);
        }
      });
    }
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
}