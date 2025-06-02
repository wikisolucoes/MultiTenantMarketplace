import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

export interface TenantRequest extends AuthRequest {
  tenantId: number;
}

export function enforceTenantIsolation(req: TenantRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  // For admin users, allow access to any tenant via query parameter or body
  if (req.user.role === "admin") {
    const tenantId = req.query.tenantId || req.body.tenantId || req.params.tenantId;
    if (tenantId) {
      req.tenantId = parseInt(tenantId as string, 10);
      return next();
    }
    return res.status(400).json({ message: "Tenant ID required for admin operations" });
  }

  // For merchant users, enforce their own tenant
  if (req.user.role === "merchant" && req.user.tenantId) {
    req.tenantId = req.user.tenantId;
    return next();
  }

  return res.status(403).json({ message: "Tenant access denied" });
}

export function validateTenantAccess(allowedTenantId?: number) {
  return (req: TenantRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Admin can access any tenant
    if (req.user.role === "admin") {
      return next();
    }

    // Merchant can only access their own tenant
    if (req.user.role === "merchant") {
      if (allowedTenantId && req.user.tenantId !== allowedTenantId) {
        return res.status(403).json({ message: "Access denied to this tenant" });
      }
      if (req.tenantId && req.user.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Access denied to this tenant" });
      }
    }

    next();
  };
}
