import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../database/prisma.service';

export interface AuthenticatedApiRequest extends Request {
  apiCredential?: {
    id: number;
    tenantId: number;
    userId: number;
    permissions: string[];
    rateLimit: number;
  };
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedApiRequest>();
    const apiKey = this.extractApiKey(request);
    
    if (!apiKey) {
      throw new UnauthorizedException('API Key não fornecida');
    }

    try {
      const credential = await this.prisma.apiCredential.findFirst({
        where: { 
          apiKey,
          isActive: true
        },
        include: {
          tenant: true,
          user: true
        }
      });

      if (!credential) {
        throw new UnauthorizedException('API Key inválida');
      }

      // Verificar rate limiting
      if (!this.checkRateLimit(credential.id, credential.rateLimit)) {
        throw new UnauthorizedException('Rate limit excedido');
      }

      // Anexar credencial à requisição
      request.apiCredential = {
        id: credential.id,
        tenantId: credential.tenantId,
        userId: credential.userId,
        permissions: credential.permissions || [],
        rateLimit: credential.rateLimit
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Erro na validação da API Key');
    }
  }

  private extractApiKey(request: Request): string | undefined {
    // Verificar header Authorization com Bearer
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Verificar header X-API-Key
    const apiKeyHeader = request.headers['x-api-key'];
    if (apiKeyHeader && typeof apiKeyHeader === 'string') {
      return apiKeyHeader;
    }

    return undefined;
  }

  private checkRateLimit(credentialId: number, rateLimit: number): boolean {
    // Implementação básica de rate limiting em memória
    // Em produção, usar Redis ou similar
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minuto
    
    // TODO: Implementar rate limiting real com Redis
    return true;
  }
}