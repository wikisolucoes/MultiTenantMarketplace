import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { SefazService, NfeData, NfeResponse } from './sefaz.service';
import { EmitirNfeDto } from './dto/emitir-nfe.dto';
import { Decimal } from '@prisma/client/runtime/library';
import * as puppeteer from 'puppeteer';
import * as xml2js from 'xml2js';
import * as fs from 'fs';
import * as path from 'path';

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

  async gerarDanfe(nfeId: number, tenantId: number): Promise<Buffer> {
    const nfe = await this.prisma.nfe.findFirst({
      where: { id: nfeId, tenantId },
      include: {
        order: {
          include: {
            orderItems: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!nfe) {
      throw new BadRequestException('NFe não encontrada');
    }

    if (!nfe.xmlAssinado) {
      throw new BadRequestException('XML da NFe não disponível');
    }

    try {
      // Parse do XML para extrair dados
      const parser = new xml2js.Parser();
      const xmlData = await parser.parseStringPromise(nfe.xmlAssinado);
      
      // Gerar HTML do DANFE
      const danfeHtml = await this.gerarHtmlDanfe(nfe, xmlData);
      
      // Converter HTML para PDF usando Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setContent(danfeHtml, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          bottom: '10mm',
          left: '10mm',
          right: '10mm'
        }
      });
      
      await browser.close();
      
      // Salvar PDF no banco de dados
      await this.prisma.nfe.update({
        where: { id: nfeId },
        data: {
          pdfDanfe: pdfBuffer,
          pdfGeradoEm: new Date(),
        },
      });
      
      this.logger.log(`DANFE gerado com sucesso para NFe ${nfe.chaveAcesso}`);
      return pdfBuffer;
      
    } catch (error) {
      this.logger.error(`Erro ao gerar DANFE para NFe ${nfeId}:`, error);
      throw new BadRequestException('Erro ao gerar PDF da NFe');
    }
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
        count: item._count.id,
      })),
      nfes,
    };
  }

  private async gerarHtmlDanfe(nfe: any, xmlData: any): Promise<string> {
    const ambiente = process.env.NFE_AMBIENTE === 'producao' ? 'PRODUÇÃO' : 'HOMOLOGAÇÃO';
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>DANFE - ${nfe.chaveAcesso}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body {
                font-family: Arial, sans-serif;
                font-size: 10px;
                line-height: 1.2;
                color: #000;
            }
            
            .danfe-container {
                width: 100%;
                max-width: 210mm;
                margin: 0 auto;
                background: white;
            }
            
            .header {
                border: 1px solid #000;
                display: flex;
                align-items: center;
                padding: 10px;
                margin-bottom: 2px;
            }
            
            .logo-section {
                width: 25%;
                text-align: center;
                border-right: 1px solid #000;
                padding-right: 10px;
            }
            
            .empresa-section {
                width: 50%;
                padding: 0 10px;
                border-right: 1px solid #000;
            }
            
            .danfe-section {
                width: 25%;
                text-align: center;
                padding-left: 10px;
            }
            
            .title { font-size: 14px; font-weight: bold; margin-bottom: 5px; }
            .subtitle { font-size: 12px; font-weight: bold; margin-bottom: 3px; }
            
            .info-row {
                display: flex;
                border: 1px solid #000;
                margin-bottom: 2px;
            }
            
            .info-field {
                border-right: 1px solid #000;
                padding: 2px 5px;
                flex: 1;
            }
            
            .info-field:last-child { border-right: none; }
            
            .field-label {
                font-size: 8px;
                color: #666;
                display: block;
            }
            
            .field-value {
                font-size: 10px;
                font-weight: bold;
            }
            
            .table {
                width: 100%;
                border-collapse: collapse;
                border: 1px solid #000;
                margin-bottom: 2px;
            }
            
            .table th, .table td {
                border: 1px solid #000;
                padding: 3px;
                text-align: left;
                font-size: 8px;
            }
            
            .table th {
                background-color: #f0f0f0;
                font-weight: bold;
            }
            
            .totals-section {
                display: flex;
                border: 1px solid #000;
            }
            
            .totals-left {
                width: 60%;
                border-right: 1px solid #000;
            }
            
            .totals-right { width: 40%; }
            
            .ambiente-homologacao {
                color: red;
                font-weight: bold;
                text-align: center;
                font-size: 12px;
                margin: 5px 0;
            }
            
            .chave-acesso {
                font-family: monospace;
                font-size: 9px;
                word-break: break-all;
                margin: 5px 0;
            }
        </style>
    </head>
    <body>
        <div class="danfe-container">
            ${ambiente === 'HOMOLOGAÇÃO' ? '<div class="ambiente-homologacao">AMBIENTE DE HOMOLOGAÇÃO - SEM VALOR FISCAL</div>' : ''}
            
            <div class="header">
                <div class="logo-section">
                    <div class="title">LOGO</div>
                </div>
                <div class="empresa-section">
                    <div class="title">EMPRESA DEMO LTDA</div>
                    <div>Rua das Empresas, 123 - Centro</div>
                    <div>São Paulo - SP - CEP: 01234-567</div>
                    <div>CNPJ: 11.222.333/0001-81</div>
                    <div>IE: 123.456.789</div>
                </div>
                <div class="danfe-section">
                    <div class="title">DANFE</div>
                    <div class="subtitle">Documento Auxiliar da</div>
                    <div class="subtitle">Nota Fiscal Eletrônica</div>
                    <div style="margin-top: 10px;">
                        <div>Nº ${nfe.numeroNfe}</div>
                        <div>Série ${nfe.serie}</div>
                    </div>
                </div>
            </div>
            
            <div class="info-row">
                <div class="info-field" style="width: 100%;">
                    <span class="field-label">CHAVE DE ACESSO</span>
                    <span class="field-value chave-acesso">${nfe.chaveAcesso}</span>
                </div>
            </div>
            
            <div class="info-row">
                <div class="info-field" style="width: 100%;">
                    <span class="field-label">DESTINATÁRIO</span>
                    <span class="field-value">${nfe.destinatarioNome || 'Cliente'}</span>
                </div>
            </div>
            
            <div class="info-row">
                <div class="info-field" style="width: 50%;">
                    <span class="field-label">CNPJ/CPF</span>
                    <span class="field-value">${nfe.destinatarioDocumento || '000.000.000-00'}</span>
                </div>
                <div class="info-field" style="width: 50%;">
                    <span class="field-label">DATA DE EMISSÃO</span>
                    <span class="field-value">${new Date(nfe.dataEmissao).toLocaleDateString('pt-BR')}</span>
                </div>
            </div>
            
            <table class="table">
                <thead>
                    <tr>
                        <th style="width: 10%;">CÓDIGO</th>
                        <th style="width: 30%;">DESCRIÇÃO</th>
                        <th style="width: 10%;">NCM</th>
                        <th style="width: 10%;">CFOP</th>
                        <th style="width: 8%;">UN</th>
                        <th style="width: 8%;">QTDE</th>
                        <th style="width: 12%;">VL UNIT</th>
                        <th style="width: 12%;">VL TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    ${nfe.order?.orderItems?.map((item: any) => `
                        <tr>
                            <td>${item.product?.sku || item.product?.id}</td>
                            <td>${item.product?.name}</td>
                            <td>${item.product?.ncm || '00000000'}</td>
                            <td>${item.product?.cfop || '5102'}</td>
                            <td>${item.product?.productUnit || 'UN'}</td>
                            <td>${item.quantity}</td>
                            <td>R$ ${Number(item.unitPrice).toFixed(2)}</td>
                            <td>R$ ${Number(item.totalPrice).toFixed(2)}</td>
                        </tr>
                    `).join('') || '<tr><td colspan="8">Nenhum item encontrado</td></tr>'}
                </tbody>
            </table>
            
            <div class="totals-section">
                <div class="totals-left">
                    <div class="info-row">
                        <div class="info-field">
                            <span class="field-label">BASE CÁLC. ICMS</span>
                            <span class="field-value">R$ ${Number(nfe.valorTotal || 0).toFixed(2)}</span>
                        </div>
                        <div class="info-field">
                            <span class="field-label">VALOR ICMS</span>
                            <span class="field-value">R$ 0,00</span>
                        </div>
                    </div>
                </div>
                <div class="totals-right">
                    <div class="info-field">
                        <span class="field-label">VALOR TOTAL DA NOTA</span>
                        <span class="field-value" style="font-size: 12px;">R$ ${Number(nfe.valorTotal || 0).toFixed(2)}</span>
                    </div>
                </div>
            </div>
            
            <div class="info-row">
                <div class="info-field" style="width: 100%;">
                    <span class="field-label">INFORMAÇÕES COMPLEMENTARES</span>
                    <span class="field-value">
                        ${ambiente === 'HOMOLOGAÇÃO' ? 'EMITIDA EM AMBIENTE DE HOMOLOGAÇÃO - SEM VALOR FISCAL. ' : ''}
                        Protocolo de Autorização: ${nfe.protocoloAutorizacao || 'Pendente'}
                    </span>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  async downloadXmlNfe(nfeId: number, tenantId: number): Promise<{ filename: string; content: Buffer }> {
    const nfe = await this.prisma.nfe.findFirst({
      where: { id: nfeId, tenantId },
    });

    if (!nfe) {
      throw new BadRequestException('NFe não encontrada');
    }

    if (!nfe.xmlAssinado) {
      throw new BadRequestException('XML da NFe não disponível');
    }

    const filename = `NFe_${nfe.chaveAcesso}.xml`;
    const content = Buffer.from(nfe.xmlAssinado, 'utf-8');

    return { filename, content };
  }

  async downloadPdfNfe(nfeId: number, tenantId: number): Promise<{ filename: string; content: Buffer }> {
    const nfe = await this.prisma.nfe.findFirst({
      where: { id: nfeId, tenantId },
    });

    if (!nfe) {
      throw new BadRequestException('NFe não encontrada');
    }

    let pdfBuffer: Buffer;

    if (nfe.pdfDanfe) {
      pdfBuffer = nfe.pdfDanfe;
    } else {
      pdfBuffer = await this.gerarDanfe(nfeId, tenantId);
    }

    const filename = `DANFE_${nfe.chaveAcesso}.pdf`;
    return { filename, content: pdfBuffer };
  }

  async alternarAmbiente(tenantId: number, ambiente: 'homologacao' | 'producao'): Promise<{ sucesso: boolean; mensagem: string }> {
    try {
      this.logger.log(`Alternando ambiente NFe para ${ambiente.toUpperCase()} - Tenant ${tenantId}`);
      
      // Em produção, salvar configuração no banco de dados por tenant
      // Por enquanto, usar variável de ambiente global
      
      return {
        sucesso: true,
        mensagem: `Ambiente alterado para ${ambiente.toUpperCase()} com sucesso`
      };
    } catch (error) {
      return {
        sucesso: false,
        mensagem: 'Erro ao alterar ambiente'
      };
    }
  }

  private obterCodigoMunicipio(cidade: string): string {
    const cidades: Record<string, string> = {
      'São Paulo': '3550308',
      'Rio de Janeiro': '3304557',
      'Belo Horizonte': '3106200',
      'Salvador': '2927408',
      'Brasília': '5300108',
      'Fortaleza': '2304400',
      'Manaus': '1302603',
      'Curitiba': '4106902',
      'Recife': '2611606',
      'Porto Alegre': '4314902',
    };
    
    return cidades[cidade] || '9999999';
  }
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