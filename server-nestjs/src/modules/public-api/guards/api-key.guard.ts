import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('Chave da API não fornecida');
    }

    const credential = await this.prisma.apiCredentials.findUnique({
      where: { key: apiKey, isActive: true }
    });

    if (!credential) {
      throw new UnauthorizedException('Chave da API inválida');
    }

    // Log API usage
    await this.prisma.apiUsageLogs.create({
      data: {
        credentialId: credential.id,
        tenantId: credential.tenantId,
        endpoint: request.path,
        method: request.method,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] || '',
        responseStatus: 200 // Will be updated after response
      }
    });

    request.apiCredential = credential;
    return true;
  }
}