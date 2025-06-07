import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  ParseIntPipe,
  HttpStatus,
  HttpException,
  Res,
  Header
} from '@nestjs/common';
import { Response } from 'express';
import { NfeService, NfeProcessingResult } from './nfe.service';
import { EmitirNfeDto } from './dto/emitir-nfe.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('nfe')
@UseGuards(JwtAuthGuard)
export class NfeController {
  constructor(private readonly nfeService: NfeService) {}

  @Post('emitir/pedido/:orderId')
  async emitirNfePorPedido(
    @Param('orderId', ParseIntPipe) orderId: number,
    @GetUser() user: any,
  ): Promise<NfeProcessingResult> {
    try {
      return await this.nfeService.emitirNfePorPedido(orderId, user.tenantId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao emitir NFe',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('emitir/manual')
  async emitirNfeManual(
    @Body() dados: EmitirNfeDto,
    @GetUser() user: any,
  ): Promise<NfeProcessingResult> {
    try {
      return await this.nfeService.emitirNfeManual(dados, user.tenantId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao emitir NFe manual',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':nfeId/cancelar')
  async cancelarNfe(
    @Param('nfeId', ParseIntPipe) nfeId: number,
    @Body('motivo') motivo: string,
    @GetUser() user: any,
  ): Promise<{ sucesso: boolean; protocolo?: string; erro?: string }> {
    try {
      if (!motivo || motivo.length < 15) {
        throw new HttpException(
          'Motivo do cancelamento deve ter pelo menos 15 caracteres',
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.nfeService.cancelarNfe(nfeId, motivo, user.tenantId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao cancelar NFe',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':nfeId/status')
  async consultarStatusNfe(
    @Param('nfeId', ParseIntPipe) nfeId: number,
    @GetUser() user: any,
  ): Promise<{ status: string; situacao: string; dataProcessamento?: string }> {
    try {
      return await this.nfeService.consultarStatusNfe(nfeId, user.tenantId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao consultar NFe',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  async listarNfes(
    @GetUser() user: any,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('status') status?: string,
  ) {
    try {
      const pageNumber = parseInt(page.toString(), 10) || 1;
      const limitNumber = parseInt(limit.toString(), 10) || 50;

      return await this.nfeService.listarNfes(
        user.tenantId,
        pageNumber,
        limitNumber,
        status,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao listar NFes',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':nfeId')
  async obterNfe(
    @Param('nfeId', ParseIntPipe) nfeId: number,
    @GetUser() user: any,
  ) {
    try {
      return await this.nfeService.obterNfePorId(nfeId, user.tenantId);
    } catch (error) {
      throw new HttpException(
        error.message || 'NFe não encontrada',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Get(':nfeId/xml')
  async obterXmlNfe(
    @Param('nfeId', ParseIntPipe) nfeId: number,
    @GetUser() user: any,
  ): Promise<{ xml: string }> {
    try {
      const xml = await this.nfeService.obterXmlNfe(nfeId, user.tenantId);
      return { xml };
    } catch (error) {
      throw new HttpException(
        error.message || 'XML da NFe não disponível',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Get(':nfeId/danfe')
  async gerarDanfe(
    @Param('nfeId', ParseIntPipe) nfeId: number,
    @GetUser() user: any,
  ): Promise<{ pdf: string }> {
    try {
      const pdf = await this.nfeService.gerarDanfe(nfeId, user.tenantId);
      return { pdf };
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao gerar DANFE',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':nfeId/email')
  async enviarNfePorEmail(
    @Param('nfeId', ParseIntPipe) nfeId: number,
    @Body('email') email: string,
    @GetUser() user: any,
  ): Promise<{ sucesso: boolean; mensagem: string }> {
    try {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new HttpException(
          'Email inválido',
          HttpStatus.BAD_REQUEST,
        );
      }

      const resultado = await this.nfeService.enviarNfePorEmail(
        nfeId,
        email,
        user.tenantId,
      );
      
      return resultado;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao enviar NFe por email',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('relatorio/emissoes')
  async relatorioEmissoes(
    @GetUser() user: any,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('status') status?: string,
  ) {
    try {
      return await this.nfeService.relatorioEmissoes(
        user.tenantId,
        dataInicio,
        dataFim,
        status,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao gerar relatório',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('reenviar-sefaz/:nfeId')
  async reenviarParaSefaz(
    @Param('nfeId', ParseIntPipe) nfeId: number,
    @GetUser() user: any,
  ): Promise<NfeProcessingResult> {
    try {
      return await this.nfeService.reenviarParaSefaz(nfeId, user.tenantId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao reenviar NFe para SEFAZ',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}