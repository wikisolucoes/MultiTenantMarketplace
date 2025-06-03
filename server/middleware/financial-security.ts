import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { 
  apiRateLimits, 
  securityAuditLog,
  type InsertSecurityAuditLog 
} from "@shared/schema";
import { eq, and, gte } from "drizzle-orm";
import rateLimit from "express-rate-limit";

export interface SecureRequest extends Request {
  tenantId?: number;
  userId?: number;
  sessionId?: string;
  riskScore?: number;
  deviceFingerprint?: string;
}

export interface FinancialContext {
  operation: string;
  amount?: number;
  tenantId: number;
  userId?: number;
  ipAddress: string;
  userAgent: string;
  sessionId?: string;
}

/**
 * Advanced rate limiting for financial operations
 */
export const financialOperationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req: SecureRequest) => {
    // Dynamic limits based on operation type and risk
    const operation = req.path;
    
    if (operation.includes('withdrawal') || operation.includes('cash-out')) {
      return 5; // Max 5 withdrawals per 15 minutes
    }
    
    if (operation.includes('transfer') || operation.includes('payment')) {
      return 20; // Max 20 transfers per 15 minutes
    }
    
    return 50; // Default limit for other operations
  },
  message: {
    error: "Rate limit exceeded for financial operations",
    retryAfter: "15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Withdrawal-specific rate limiting with strict controls
 */
export const withdrawalLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10, // Max 10 withdrawals per day
  keyGenerator: (req: SecureRequest) => {
    return `withdrawal:${req.tenantId}:${req.ip}`;
  },
  message: {
    error: "Daily withdrawal limit exceeded",
    limit: 10,
    retryAfter: "24 hours"
  },
});

/**
 * Risk assessment middleware for financial operations
 */
export function assessFinancialRisk(
  req: SecureRequest, 
  res: Response, 
  next: NextFunction
): void {
  const context: FinancialContext = {
    operation: req.path,
    amount: req.body.amount ? parseFloat(req.body.amount) : undefined,
    tenantId: req.tenantId || 0,
    userId: req.userId,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent') || '',
    sessionId: req.sessionId,
  };

  const riskScore = calculateRiskScore(context, req);
  req.riskScore = riskScore;

  // Block high-risk operations immediately
  if (riskScore >= 90) {
    logSecurityEvent(context, {
      action: "high_risk_operation_blocked",
      resource: "financial_operation",
      success: false,
      failureReason: `High risk score: ${riskScore}`,
      riskScore,
    });

    res.status(403).json({
      error: "Operation blocked due to high risk assessment",
      riskScore,
      contactSupport: true
    });
    return;
  }

  // Require additional verification for medium-high risk
  if (riskScore >= 70) {
    req.headers['x-require-additional-auth'] = 'true';
  }

  next();
}

/**
 * Device fingerprinting middleware for fraud detection
 */
export function deviceFingerprinting(
  req: SecureRequest, 
  res: Response, 
  next: NextFunction
): void {
  const fingerprint = generateDeviceFingerprint(req);
  req.deviceFingerprint = fingerprint;

  // Check for suspicious device patterns
  if (isSuspiciousDevice(fingerprint, req)) {
    logSecurityEvent({
      operation: req.path,
      tenantId: req.tenantId || 0,
      userId: req.userId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || '',
    }, {
      action: "suspicious_device_detected",
      resource: "device_fingerprint",
      success: false,
      failureReason: "Suspicious device patterns detected",
      riskScore: 80,
      deviceFingerprint: fingerprint,
    });
  }

  next();
}

/**
 * Geo-location validation for financial operations
 */
export function validateGeoLocation(
  req: SecureRequest, 
  res: Response, 
  next: NextFunction
): void {
  const geoData = extractGeoLocation(req);
  
  // Check for suspicious locations (VPN, Tor, high-risk countries)
  if (geoData.isHighRisk) {
    logSecurityEvent({
      operation: req.path,
      tenantId: req.tenantId || 0,
      userId: req.userId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || '',
    }, {
      action: "high_risk_location_detected",
      resource: "geo_location",
      success: false,
      failureReason: `High-risk location: ${geoData.country}`,
      riskScore: 60,
      geoLocation: geoData,
    });

    // Add additional verification requirement
    req.headers['x-require-geo-verification'] = 'true';
  }

  next();
}

/**
 * Transaction amount validation with dynamic limits
 */
export function validateTransactionAmount(
  req: SecureRequest, 
  res: Response, 
  next: NextFunction
): void {
  const amount = parseFloat(req.body.amount || '0');
  const operation = req.path;

  // Get dynamic limits based on tenant and operation
  const limits = getDynamicLimits(req.tenantId || 0, operation);

  if (amount > limits.maxAmount) {
    logSecurityEvent({
      operation: req.path,
      amount,
      tenantId: req.tenantId || 0,
      userId: req.userId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || '',
    }, {
      action: "amount_limit_exceeded",
      resource: "transaction_amount",
      success: false,
      failureReason: `Amount ${amount} exceeds limit ${limits.maxAmount}`,
      riskScore: 70,
    });

    res.status(400).json({
      error: "Transaction amount exceeds maximum limit",
      maxAmount: limits.maxAmount,
      requestedAmount: amount
    });
    return;
  }

  if (amount < limits.minAmount) {
    res.status(400).json({
      error: "Transaction amount below minimum limit",
      minAmount: limits.minAmount,
      requestedAmount: amount
    });
    return;
  }

  next();
}

/**
 * Session validation for financial operations
 */
export function validateFinancialSession(
  req: SecureRequest, 
  res: Response, 
  next: NextFunction
): void {
  const sessionAge = getSessionAge(req.sessionId);
  const requiresFreshSession = req.path.includes('withdrawal') || 
                              req.path.includes('transfer') ||
                              parseFloat(req.body.amount || '0') > 1000;

  if (requiresFreshSession && sessionAge > 30 * 60 * 1000) { // 30 minutes
    res.status(401).json({
      error: "Session expired for financial operation",
      requiresReauth: true,
      sessionAge: sessionAge
    });
    return;
  }

  next();
}

/**
 * Calculates risk score based on multiple factors
 */
function calculateRiskScore(context: FinancialContext, req: SecureRequest): number {
  let score = 0;

  // Amount-based risk (0-30 points)
  if (context.amount) {
    if (context.amount > 50000) score += 30;
    else if (context.amount > 10000) score += 20;
    else if (context.amount > 5000) score += 15;
    else if (context.amount > 1000) score += 10;
  }

  // Operation type risk (0-25 points)
  if (context.operation.includes('withdrawal')) score += 25;
  else if (context.operation.includes('transfer')) score += 20;
  else if (context.operation.includes('cash-out')) score += 20;
  else if (context.operation.includes('payment')) score += 10;

  // Time-based risk (0-15 points)
  const hour = new Date().getHours();
  if (hour >= 23 || hour <= 5) score += 15; // Late night/early morning
  else if (hour >= 22 || hour <= 6) score += 10;

  // Geographic risk (0-20 points)
  const geoData = extractGeoLocation(req);
  if (geoData.isHighRisk) score += 20;
  else if (geoData.isVPN) score += 15;

  // Device risk (0-10 points)
  if (req.deviceFingerprint && isSuspiciousDevice(req.deviceFingerprint, req)) {
    score += 10;
  }

  return Math.min(score, 100);
}

/**
 * Generates device fingerprint for fraud detection
 */
function generateDeviceFingerprint(req: SecureRequest): string {
  const userAgent = req.get('User-Agent') || '';
  const acceptLanguage = req.get('Accept-Language') || '';
  const acceptEncoding = req.get('Accept-Encoding') || '';
  const ip = req.ip;

  // Simple fingerprint - in production, this would be more sophisticated
  const fingerprint = Buffer.from(`${userAgent}:${acceptLanguage}:${acceptEncoding}:${ip}`)
    .toString('base64')
    .substring(0, 32);

  return fingerprint;
}

/**
 * Checks if device shows suspicious patterns
 */
function isSuspiciousDevice(fingerprint: string, req: SecureRequest): boolean {
  const userAgent = req.get('User-Agent') || '';
  
  // Check for common bot patterns
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /curl/i, /wget/i, /python/i
  ];
  
  return botPatterns.some(pattern => pattern.test(userAgent));
}

/**
 * Extracts and validates geo-location data
 */
function extractGeoLocation(req: SecureRequest): any {
  // In production, this would integrate with a geo-IP service
  const ip = req.ip;
  
  // Mock geo data - replace with real geo-IP service
  return {
    ip,
    country: 'BR',
    isHighRisk: false,
    isVPN: false,
    isTor: false,
  };
}

/**
 * Gets dynamic transaction limits based on tenant and operation
 */
function getDynamicLimits(tenantId: number, operation: string): {
  maxAmount: number;
  minAmount: number;
} {
  // In production, these would be configurable per tenant
  const baseLimits = {
    withdrawal: { max: 50000, min: 10 },
    transfer: { max: 100000, min: 1 },
    payment: { max: 500000, min: 0.01 },
    default: { max: 10000, min: 0.01 },
  };

  let limits = baseLimits.default;
  
  if (operation.includes('withdrawal')) limits = baseLimits.withdrawal;
  else if (operation.includes('transfer')) limits = baseLimits.transfer;
  else if (operation.includes('payment')) limits = baseLimits.payment;

  return {
    maxAmount: limits.max,
    minAmount: limits.min,
  };
}

/**
 * Gets session age in milliseconds
 */
function getSessionAge(sessionId?: string): number {
  if (!sessionId) return Infinity;
  
  // In production, this would check session creation time from storage
  return 0; // Mock - always fresh
}

/**
 * Logs security events for compliance and monitoring
 */
async function logSecurityEvent(
  context: FinancialContext, 
  audit: Partial<InsertSecurityAuditLog>
): Promise<void> {
  try {
    await db.insert(securityAuditLog).values({
      tenantId: context.tenantId,
      userId: context.userId,
      action: audit.action || 'unknown',
      resource: audit.resource || 'unknown',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      sessionId: context.sessionId,
      success: audit.success || false,
      failureReason: audit.failureReason,
      riskScore: audit.riskScore,
      geoLocation: audit.geoLocation,
      deviceFingerprint: audit.deviceFingerprint,
      ...audit,
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

/**
 * Middleware to enforce secure headers for financial operations
 */
export function secureFinancialHeaders(
  req: SecureRequest, 
  res: Response, 
  next: NextFunction
): void {
  // Security headers for financial operations
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  
  next();
}

/**
 * Complete financial security middleware stack
 */
export const financialSecurityStack = [
  secureFinancialHeaders,
  deviceFingerprinting,
  validateGeoLocation,
  assessFinancialRisk,
  validateFinancialSession,
  validateTransactionAmount,
];