import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { SefazService, NfeData, NfeResponse } from './sefaz.service';
import { EmitirNfeDto } from './dto/emitir-nfe.dto';
import { Decimal } from '@prisma/client/runtime/library';

export interface NfeProcessingResult {
  nfeId: number;
  chaveAcesso: string;
  numeroNfe: string;
  status: string;
  xmlAssinado?: string;
  protocoloAutorizacao?: string;
  motivoRejeicao?: string;
}

@Injectable()
export class NfeService {
  private readonly logger = new Logger(NfeService.name);

  constructor(
    private prisma: PrismaService,
    private sefazService: SefazService,
  ) {}

  async emitirNfePorPedido(orderId: number, tenantId: number): Promise<NfeProcessingResult> {
    try {
      this.logger.log(`Iniciando emissão de NFe para pedido ${orderId}`);

      // Buscar dados completos do pedido
      const order = await this.prisma.order.findFirst({
        where: { id: orderId, tenantId },
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
          tenant: true,
        },
      });

      if (!order) {
        throw new BadRequestException('Pedido não encontrado');
      }

      if (order.nfeKey) {
        throw new BadRequestException('NFe já emitida para este pedido');
      }

      // Converter dados do pedido para formato NFe
      const nfeData = await this.converterPedidoParaNfe(order);

      // Emitir NFe via SEFAZ
      const nfeResponse = await this.sefazService.emitirNfe(nfeData);

      // Salvar NFe no banco de dados
      const nfe = await this.prisma.nfe.create({
        data: {
          tenantId,
          orderId,
          chaveAcesso: nfeResponse.chaveAcesso,
          numeroNfe: nfeResponse.numeroNfe,
          serie: nfeResponse.serie,
          dataEmissao: new Date(nfeResponse.dataEmissao),
          status: nfeResponse.status,
          protocoloAutorizacao: nfeResponse.protocoloAutorizacao,
          xmlAssinado: nfeResponse.xmlAssinado,
          motivoRejeicao: nfeResponse.motivoRejeicao,
        },
      });

      // Atualizar pedido com dados da NFe
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          nfeKey: nfeResponse.chaveAcesso,
          nfeNumber: nfeResponse.numeroNfe,
          nfeStatus: nfeResponse.status,
          nfeProtocol: nfeResponse.protocoloAutorizacao,
        },
      });

      this.logger.log(`NFe emitida com sucesso: ${nfeResponse.chaveAcesso}`);

      return {
        nfeId: nfe.id,
        chaveAcesso: nfeResponse.chaveAcesso,
        numeroNfe: nfeResponse.numeroNfe,
        status: nfeResponse.status,
        xmlAssinado: nfeResponse.xmlAssinado,
        protocoloAutorizacao: nfeResponse.protocoloAutorizacao,
        motivoRejeicao: nfeResponse.motivoRejeicao,
      };
    } catch (error) {
      this.logger.error(`Erro ao emitir NFe para pedido ${orderId}:`, error);
      throw error;
    }
  }

  async emitirNfeManual(dados: EmitirNfeDto, tenantId: number): Promise<NfeProcessingResult> {
    try {
      this.logger.log('Iniciando emissão manual de NFe');

      // Buscar dados do tenant
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        throw new BadRequestException('Tenant não encontrado');
      }

      // Converter DTO para formato NFe
      const nfeData = this.converterDtoParaNfe(dados, tenant);

      // Emitir NFe via SEFAZ
      const nfeResponse = await this.sefazService.emitirNfe(nfeData);

      // Salvar NFe no banco de dados
      const nfe = await this.prisma.nfe.create({
        data: {
          tenantId,
          chaveAcesso: nfeResponse.chaveAcesso,
          numeroNfe: nfeResponse.numeroNfe,
          serie: nfeResponse.serie,
          dataEmissao: new Date(nfeResponse.dataEmissao),
          status: nfeResponse.status,
          protocoloAutorizacao: nfeResponse.protocoloAutorizacao,
          xmlAssinado: nfeResponse.xmlAssinado,
          motivoRejeicao: nfeResponse.motivoRejeicao,
          destinatarioNome: dados.destinatario.razaoSocial,
          destinatarioDocumento: dados.destinatario.cnpjCpf,
          valorTotal: new Decimal(dados.totais.valorTotalNota),
        },
      });

      this.logger.log(`NFe manual emitida com sucesso: ${nfeResponse.chaveAcesso}`);

      return {
        nfeId: nfe.id,
        chaveAcesso: nfeResponse.chaveAcesso,
        numeroNfe: nfeResponse.numeroNfe,
        status: nfeResponse.status,
        xmlAssinado: nfeResponse.xmlAssinado,
        protocoloAutorizacao: nfeResponse.protocoloAutorizacao,
        motivoRejeicao: nfeResponse.motivoRejeicao,
      };
    } catch (error) {
      this.logger.error('Erro ao emitir NFe manual:', error);
      throw error;
    }
  }

  async cancelarNfe(nfeId: number, motivo: string, tenantId: number): Promise<{ sucesso: boolean; protocolo?: string; erro?: string }> {
    try {
      const nfe = await this.prisma.nfe.findFirst({
        where: { id: nfeId, tenantId },
      });

      if (!nfe) {
        throw new BadRequestException('NFe não encontrada');
      }

      if (nfe.status === 'cancelada') {
        throw new BadRequestException('NFe já está cancelada');
      }

      // Cancelar na SEFAZ
      const resultado = await this.sefazService.cancelarNfe(nfe.chaveAcesso, motivo);

      if (resultado.sucesso) {
        // Atualizar status no banco
        await this.prisma.nfe.update({
          where: { id: nfeId },
          data: {
            status: 'cancelada',
            motivoCancelamento: motivo,
            protocoloCancelamento: resultado.protocolo,
            dataCancelamento: new Date(),
          },
        });

        // Atualizar pedido se houver
        if (nfe.orderId) {
          await this.prisma.order.update({
            where: { id: nfe.orderId },
            data: {
              nfeStatus: 'cancelada',
            },
          });
        }
      }

      return resultado;
    } catch (error) {
      this.logger.error(`Erro ao cancelar NFe ${nfeId}:`, error);
      throw error;
    }
  }

  async consultarStatusNfe(nfeId: number, tenantId: number): Promise<{ status: string; situacao: string; dataProcessamento?: string }> {
    try {
      const nfe = await this.prisma.nfe.findFirst({
        where: { id: nfeId, tenantId },
      });

      if (!nfe) {
        throw new BadRequestException('NFe não encontrada');
      }

      const resultado = await this.sefazService.consultarStatusNfe(nfe.chaveAcesso);

      // Atualizar status se necessário
      if (resultado.status !== nfe.status) {
        await this.prisma.nfe.update({
          where: { id: nfeId },
          data: {
            status: resultado.status,
          },
        });
      }

      return resultado;
    } catch (error) {
      this.logger.error(`Erro ao consultar NFe ${nfeId}:`, error);
      throw error;
    }
  }

  async listarNfes(tenantId: number, page = 1, limit = 50, status?: string) {
    const skip = (page - 1) * limit;
    
    const where: any = { tenantId };
    if (status) {
      where.status = status;
    }

    const [nfes, total] = await Promise.all([
      this.prisma.nfe.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dataEmissao: 'desc' },
        include: {
          order: {
            select: {
              id: true,
              customerName: true,
              totalAmount: true,
            },
          },
        },
      }),
      this.prisma.nfe.count({ where }),
    ]);

    return {
      data: nfes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async obterXmlNfe(nfeId: number, tenantId: number): Promise<string> {
    const nfe = await this.prisma.nfe.findFirst({
      where: { id: nfeId, tenantId },
    });

    if (!nfe) {
      throw new BadRequestException('NFe não encontrada');
    }

    if (!nfe.xmlAssinado) {
      throw new BadRequestException('XML da NFe não disponível');
    }

    return nfe.xmlAssinado;
  }

  private async converterPedidoParaNfe(order: any): Promise<NfeData> {
    // Buscar configurações fiscais do tenant
    const configuracaoFiscal = await this.buscarConfiguracaoFiscal(order.tenantId);

    return {
      emitente: {
        cnpj: configuracaoFiscal.cnpj,
        razaoSocial: configuracaoFiscal.razaoSocial,
        nomeFantasia: configuracaoFiscal.nomeFantasia,
        inscricaoEstadual: configuracaoFiscal.inscricaoEstadual,
        endereco: configuracaoFiscal.endereco,
      },
      destinatario: {
        cnpjCpf: order.customerDocument || '00000000000',
        razaoSocial: order.customerName,
        endereco: {
          logradouro: order.customerAddress,
          numero: '0',
          bairro: 'Centro',
          codigoMunicipio: this.obterCodigoMunicipio(order.customerCity),
          nomeMunicipio: order.customerCity,
          uf: order.customerState,
          cep: order.customerZipCode?.replace(/\D/g, '') || '00000000',
        },
      },
      itens: order.orderItems.map((item: any, index: number) => ({
        numero: index + 1,
        codigo: item.product.sku || item.product.id.toString(),
        descricao: item.product.name,
        ncm: item.product.ncm || '00000000',
        cest: item.product.cest,
        cfop: item.product.cfop || '5102',
        unidade: item.product.productUnit || 'UN',
        quantidade: item.quantity,
        valorUnitario: Number(item.unitPrice),
        valorTotal: Number(item.totalPrice),
        icms: {
          origem: item.product.icmsOrigin || '0',
          cst: item.product.icmsCst || '00',
          aliquota: Number(item.product.icmsRate) || 0,
          valor: Number(item.totalPrice) * (Number(item.product.icmsRate) || 0) / 100,
        },
        ipi: item.product.ipiRate ? {
          cst: item.product.ipiCst || '99',
          aliquota: Number(item.product.ipiRate),
          valor: Number(item.totalPrice) * Number(item.product.ipiRate) / 100,
        } : undefined,
        pis: {
          cst: item.product.pisCst || '01',
          aliquota: Number(item.product.pisRate) || 0,
          valor: Number(item.totalPrice) * (Number(item.product.pisRate) || 0) / 100,
        },
        cofins: {
          cst: item.product.cofinsCst || '01',
          aliquota: Number(item.product.cofinsRate) || 0,
          valor: Number(item.totalPrice) * (Number(item.product.cofinsRate) || 0) / 100,
        },
      })),
      totais: this.calcularTotais(order),
      informacoesComplementares: order.notes,
    };
  }

  private converterDtoParaNfe(dados: EmitirNfeDto, tenant: any): NfeData {
    return {
      emitente: dados.emitente,
      destinatario: dados.destinatario,
      itens: dados.itens,
      totais: dados.totais,
      informacoesComplementares: dados.informacoesComplementares,
      observacoesFisco: dados.observacoesFisco,
    };
  }

  private async buscarConfiguracaoFiscal(tenantId: number) {
    // Em produção, buscar configurações fiscais do tenant
    return {
      cnpj: '11222333000181',
      razaoSocial: 'Empresa Demo LTDA',
      nomeFantasia: 'Loja Demo',
      inscricaoEstadual: '123456789',
      endereco: {
        logradouro: 'Rua das Empresas',
        numero: '123',
        bairro: 'Centro',
        codigoMunicipio: '3550308',
        nomeMunicipio: 'São Paulo',
        uf: 'SP',
        cep: '01234567',
      },
    };
  }

  private calcularTotais(order: any) {
    const valorTotalProdutos = order.orderItems.reduce((sum: number, item: any) => 
      sum + Number(item.totalPrice), 0);
    
    const valorIcms = order.orderItems.reduce((sum: number, item: any) => 
      sum + (Number(item.totalPrice) * (Number(item.product.icmsRate) || 0) / 100), 0);
    
    const valorIpi = order.orderItems.reduce((sum: number, item: any) => 
      sum + (Number(item.totalPrice) * (Number(item.product.ipiRate) || 0) / 100), 0);
    
    const valorPis = order.orderItems.reduce((sum: number, item: any) => 
      sum + (Number(item.totalPrice) * (Number(item.product.pisRate) || 0) / 100), 0);
    
    const valorCofins = order.orderItems.reduce((sum: number, item: any) => 
      sum + (Number(item.totalPrice) * (Number(item.product.cofinsRate) || 0) / 100), 0);

    return {
      baseCalculoIcms: valorTotalProdutos,
      valorIcms,
      baseCalculoIcmsSt: 0,
      valorIcmsSt: 0,
      valorTotalProdutos,
      valorFrete: Number(order.shippingAmount) || 0,
      valorSeguro: 0,
      valorDesconto: Number(order.discountAmount) || 0,
      valorIi: 0,
      valorIpi,
      valorPis,
      valorCofins,
      valorOutrasDespesas: 0,
      valorTotalNota: Number(order.totalAmount),
    };
  }

  async obterNfePorId(nfeId: number, tenantId: number) {
    const nfe = await this.prisma.nfe.findFirst({
      where: { id: nfeId, tenantId },
      include: {
        order: {
          select: {
            id: true,
            customerName: true,
            totalAmount: true,
          },
        },
      },
    });

    if (!nfe) {
      throw new BadRequestException('NFe não encontrada');
    }

    return nfe;
  }

  async gerarDanfe(nfeId: number, tenantId: number): Promise<string> {
    const nfe = await this.prisma.nfe.findFirst({
      where: { id: nfeId, tenantId },
    });

    if (!nfe) {
      throw new BadRequestException('NFe não encontrada');
    }

    if (!nfe.xmlAssinado) {
      throw new BadRequestException('XML da NFe não disponível');
    }

    // Em produção, implementar geração do PDF DANFE a partir do XML
    // Retornando base64 simulado para desenvolvimento
    return 'data:application/pdf;base64,JVBERi0xLjQKJcfsj6IKNSAwIG9iago8PAovTGVuZ3RoIDYgMCBSCi9GaWx0ZXIgL0ZsYXRlRGVjb2RlCj4+CnN0cmVhbQp4nDPQM1Qo5ypUMFaw0jNUKEez0jNRyOMyVAhJLS5RyE';
  }

  async enviarNfePorEmail(nfeId: number, email: string, tenantId: number): Promise<{ sucesso: boolean; mensagem: string }> {
    try {
      const nfe = await this.prisma.nfe.findFirst({
        where: { id: nfeId, tenantId },
      });

      if (!nfe) {
        throw new BadRequestException('NFe não encontrada');
      }

      if (!nfe.xmlAssinado) {
        throw new BadRequestException('XML da NFe não disponível');
      }

      // Em produção, implementar envio por email usando SendGrid
      this.logger.log(`Enviando NFe ${nfe.chaveAcesso} para email ${email}`);
      
      return {
        sucesso: true,
        mensagem: 'NFe enviada por email com sucesso',
      };
    } catch (error) {
      return {
        sucesso: false,
        mensagem: error.message || 'Erro ao enviar NFe por email',
      };
    }
  }

  async relatorioEmissoes(
    tenantId: number,
    dataInicio?: string,
    dataFim?: string,
    status?: string,
  ) {
    const where: any = { tenantId };

    if (dataInicio && dataFim) {
      where.dataEmissao = {
        gte: new Date(dataInicio),
        lte: new Date(dataFim),
      };
    }

    if (status) {
      where.status = status;
    }

    const [nfes, total, totalPorStatus] = await Promise.all([
      this.prisma.nfe.findMany({
        where,
        orderBy: { dataEmissao: 'desc' },
        include: {
          order: {
            select: {
              id: true,
              customerName: true,
              totalAmount: true,
            },
          },
        },
      }),
      this.prisma.nfe.count({ where }),
      this.prisma.nfe.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: {
          id: true,
        },
      }),
    ]);

    const valorTotal = nfes.reduce((sum, nfe) => sum + Number(nfe.valorTotal || 0), 0);

    return {
      resumo: {
        total,
        valorTotal,
        periodo: dataInicio && dataFim ? { dataInicio, dataFim } : null,
      },
      statusDistribution: totalPorStatus.map(item => ({
        status: item.status,
        quantidade: item._count.id,
      })),
      nfes,
    };
  }

  async reenviarParaSefaz(nfeId: number, tenantId: number): Promise<NfeProcessingResult> {
    try {
      const nfe = await this.prisma.nfe.findFirst({
        where: { id: nfeId, tenantId },
      });

      if (!nfe) {
        throw new BadRequestException('NFe não encontrada');
      }

      if (nfe.status === 'autorizada') {
        throw new BadRequestException('NFe já está autorizada');
      }

      // Simular reenvio para SEFAZ
      const novoStatus = 'autorizada';
      const protocoloAutorizacao = '123456789012345';

      await this.prisma.nfe.update({
        where: { id: nfeId },
        data: {
          status: novoStatus,
          protocoloAutorizacao,
        },
      });

      // Atualizar pedido se houver
      if (nfe.orderId) {
        await this.prisma.order.update({
          where: { id: nfe.orderId },
          data: {
            nfeStatus: novoStatus,
            nfeProtocol: protocoloAutorizacao,
          },
        });
      }

      return {
        nfeId: nfe.id,
        chaveAcesso: nfe.chaveAcesso,
        numeroNfe: nfe.numeroNfe,
        status: novoStatus,
        protocoloAutorizacao,
      };
    } catch (error) {
      this.logger.error(`Erro ao reenviar NFe ${nfeId} para SEFAZ:`, error);
      throw error;
    }
  }

  private obterCodigoMunicipio(nomeMunicipio: string): string {
    // Em produção, usar tabela de municípios do IBGE
    const municipios: { [key: string]: string } = {
      'São Paulo': '3550308',
      'Rio de Janeiro': '3304557',
      'Belo Horizonte': '3106200',
      'Brasília': '5300108',
      'Salvador': '2927408',
    };
    
    return municipios[nomeMunicipio] || '3550308'; // Default São Paulo
  }
}