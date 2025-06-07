import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface SefazConfig {
  environment: 'homologacao' | 'producao';
  certificatePath: string;
  certificatePassword: string;
  cnpj: string;
  inscricaoEstadual: string;
  uf: string;
}

export interface NfeData {
  // Dados do emitente
  emitente: {
    cnpj: string;
    razaoSocial: string;
    nomeFantasia?: string;
    inscricaoEstadual: string;
    endereco: {
      logradouro: string;
      numero: string;
      complemento?: string;
      bairro: string;
      codigoMunicipio: string;
      nomeMunicipio: string;
      uf: string;
      cep: string;
    };
  };
  
  // Dados do destinatário
  destinatario: {
    cnpjCpf: string;
    razaoSocial: string;
    inscricaoEstadual?: string;
    endereco: {
      logradouro: string;
      numero: string;
      complemento?: string;
      bairro: string;
      codigoMunicipio: string;
      nomeMunicipio: string;
      uf: string;
      cep: string;
    };
  };
  
  // Itens da NFe
  itens: Array<{
    numero: number;
    codigo: string;
    descricao: string;
    ncm: string;
    cest?: string;
    cfop: string;
    unidade: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
    // Impostos
    icms: {
      origem: string;
      cst: string;
      aliquota?: number;
      valor?: number;
    };
    ipi?: {
      cst: string;
      aliquota?: number;
      valor?: number;
    };
    pis: {
      cst: string;
      aliquota?: number;
      valor?: number;
    };
    cofins: {
      cst: string;
      aliquota?: number;
      valor?: number;
    };
  }>;
  
  // Totais
  totais: {
    baseCalculoIcms: number;
    valorIcms: number;
    baseCalculoIcmsSt: number;
    valorIcmsSt: number;
    valorTotalProdutos: number;
    valorFrete: number;
    valorSeguro: number;
    valorDesconto: number;
    valorIi: number;
    valorIpi: number;
    valorPis: number;
    valorCofins: number;
    valorOutrasDespesas: number;
    valorTotalNota: number;
  };
  
  // Dados adicionais
  informacoesComplementares?: string;
  observacoesFisco?: string;
}

export interface NfeResponse {
  chaveAcesso: string;
  numeroNfe: string;
  serie: string;
  dataEmissao: string;
  protocoloAutorizacao?: string;
  xmlAssinado: string;
  status: 'autorizada' | 'rejeitada' | 'pendente';
  motivoRejeicao?: string;
}

@Injectable()
export class SefazService {
  private readonly logger = new Logger(SefazService.name);
  private api: AxiosInstance;
  private config: SefazConfig;

  constructor(private configService: ConfigService) {
    this.config = {
      environment: this.configService.get<string>('NFE_AMBIENTE', 'homologacao') as 'homologacao' | 'producao',
      certificatePath: this.configService.get<string>('SEFAZ_CERTIFICATE_PATH', ''),
      certificatePassword: this.configService.get<string>('SEFAZ_CERTIFICATE_PASSWORD', ''),
      cnpj: this.configService.get<string>('EMPRESA_CNPJ', ''),
      inscricaoEstadual: this.configService.get<string>('EMPRESA_INSCRICAO_ESTADUAL', ''),
      uf: this.configService.get<string>('EMPRESA_UF', 'SP'),
    };

    const baseUrl = this.config.environment === 'producao' 
      ? 'https://nfe.fazenda.sp.gov.br'
      : 'https://homologacao.nfe.fazenda.sp.gov.br';

    this.api = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/soap+xml; charset=utf-8',
      },
    });

    this.logger.log(`SEFAZ configurado para ambiente: ${this.config.environment.toUpperCase()}`);
  }

  async emitirNfe(nfeData: NfeData): Promise<NfeResponse> {
    try {
      this.logger.log('Iniciando emissão de NFe');
      
      // Gerar número da NFe
      const numeroNfe = await this.gerarNumeroNfe();
      
      // Criar XML da NFe
      const xmlNfe = this.criarXmlNfe(nfeData, numeroNfe);
      
      // Assinar XML
      const xmlAssinado = await this.assinarXml(xmlNfe);
      
      // Enviar para SEFAZ
      const response = await this.enviarParaSefaz(xmlAssinado);
      
      return {
        chaveAcesso: this.gerarChaveAcesso(nfeData, numeroNfe),
        numeroNfe: numeroNfe.toString(),
        serie: '001',
        dataEmissao: new Date().toISOString(),
        xmlAssinado,
        status: (response.status || 'autorizada') as 'autorizada' | 'rejeitada' | 'pendente',
        protocoloAutorizacao: response.protocoloAutorizacao,
        motivoRejeicao: response.motivoRejeicao,
      };
    } catch (error) {
      this.logger.error('Erro ao emitir NFe:', error);
      throw new Error(`Falha na emissão da NFe: ${error.message}`);
    }
  }

  async cancelarNfe(chaveAcesso: string, motivo: string): Promise<{ sucesso: boolean; protocolo?: string; erro?: string }> {
    try {
      this.logger.log(`Cancelando NFe: ${chaveAcesso}`);
      
      const xmlCancelamento = this.criarXmlCancelamento(chaveAcesso, motivo);
      const xmlAssinado = await this.assinarXml(xmlCancelamento);
      
      const response = await this.enviarCancelamentoParaSefaz(xmlAssinado);
      
      return {
        sucesso: true,
        protocolo: response.protocoloCancelamento,
      };
    } catch (error) {
      this.logger.error('Erro ao cancelar NFe:', error);
      return {
        sucesso: false,
        erro: error.message,
      };
    }
  }

  async consultarStatusNfe(chaveAcesso: string): Promise<{ status: string; situacao: string; dataProcessamento?: string }> {
    try {
      this.logger.log(`Consultando status da NFe: ${chaveAcesso}`);
      
      const xmlConsulta = this.criarXmlConsulta(chaveAcesso);
      const response = await this.enviarConsultaParaSefaz(xmlConsulta);
      
      return response;
    } catch (error) {
      this.logger.error('Erro ao consultar NFe:', error);
      throw new Error(`Falha na consulta da NFe: ${error.message}`);
    }
  }

  private async gerarNumeroNfe(): Promise<number> {
    // Em produção, isso deveria vir de um contador no banco de dados
    return Math.floor(Math.random() * 999999999) + 1;
  }

  private criarXmlNfe(nfeData: NfeData, numeroNfe: number): string {
    const dataEmissao = new Date().toISOString().split('T')[0];
    const horaEmissao = new Date().toTimeString().split(' ')[0];
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe Id="NFe${this.gerarChaveAcesso(nfeData, numeroNfe)}">
    <ide>
      <cUF>${this.getCodigoUF(nfeData.emitente.endereco.uf)}</cUF>
      <cNF>${numeroNfe.toString().padStart(8, '0')}</cNF>
      <natOp>Venda</natOp>
      <mod>55</mod>
      <serie>1</serie>
      <nNF>${numeroNfe}</nNF>
      <dhEmi>${dataEmissao}T${horaEmissao}-03:00</dhEmi>
      <tpNF>1</tpNF>
      <idDest>1</idDest>
      <cMunFG>${nfeData.emitente.endereco.codigoMunicipio}</cMunFG>
      <tpImp>1</tpImp>
      <tpEmis>1</tpEmis>
      <cDV>${this.calcularDigitoVerificador(numeroNfe.toString())}</cDV>
      <tpAmb>${this.config.environment === 'producao' ? '1' : '2'}</tpAmb>
      <finNFe>1</finNFe>
      <indFinal>1</indFinal>
      <indPres>1</indPres>
    </ide>
    
    <emit>
      <CNPJ>${nfeData.emitente.cnpj}</CNPJ>
      <xNome>${nfeData.emitente.razaoSocial}</xNome>
      ${nfeData.emitente.nomeFantasia ? `<xFant>${nfeData.emitente.nomeFantasia}</xFant>` : ''}
      <enderEmit>
        <xLgr>${nfeData.emitente.endereco.logradouro}</xLgr>
        <nro>${nfeData.emitente.endereco.numero}</nro>
        ${nfeData.emitente.endereco.complemento ? `<xCpl>${nfeData.emitente.endereco.complemento}</xCpl>` : ''}
        <xBairro>${nfeData.emitente.endereco.bairro}</xBairro>
        <cMun>${nfeData.emitente.endereco.codigoMunicipio}</cMun>
        <xMun>${nfeData.emitente.endereco.nomeMunicipio}</xMun>
        <UF>${nfeData.emitente.endereco.uf}</UF>
        <CEP>${nfeData.emitente.endereco.cep.replace(/\D/g, '')}</CEP>
      </enderEmit>
      <IE>${nfeData.emitente.inscricaoEstadual}</IE>
      <CRT>3</CRT>
    </emit>
    
    <dest>
      ${nfeData.destinatario.cnpjCpf.length === 11 ? 
        `<CPF>${nfeData.destinatario.cnpjCpf}</CPF>` : 
        `<CNPJ>${nfeData.destinatario.cnpjCpf}</CNPJ>`
      }
      <xNome>${nfeData.destinatario.razaoSocial}</xNome>
      <enderDest>
        <xLgr>${nfeData.destinatario.endereco.logradouro}</xLgr>
        <nro>${nfeData.destinatario.endereco.numero}</nro>
        ${nfeData.destinatario.endereco.complemento ? `<xCpl>${nfeData.destinatario.endereco.complemento}</xCpl>` : ''}
        <xBairro>${nfeData.destinatario.endereco.bairro}</xBairro>
        <cMun>${nfeData.destinatario.endereco.codigoMunicipio}</cMun>
        <xMun>${nfeData.destinatario.endereco.nomeMunicipio}</xMun>
        <UF>${nfeData.destinatario.endereco.uf}</UF>
        <CEP>${nfeData.destinatario.endereco.cep.replace(/\D/g, '')}</CEP>
      </enderDest>
      <indIEDest>9</indIEDest>
    </dest>
    
    ${nfeData.itens.map((item, index) => `
    <det nItem="${index + 1}">
      <prod>
        <cProd>${item.codigo}</cProd>
        <cEAN/>
        <xProd>${item.descricao}</xProd>
        <NCM>${item.ncm}</NCM>
        ${item.cest ? `<CEST>${item.cest}</CEST>` : ''}
        <CFOP>${item.cfop}</CFOP>
        <uCom>${item.unidade}</uCom>
        <qCom>${item.quantidade.toFixed(4)}</qCom>
        <vUnCom>${item.valorUnitario.toFixed(2)}</vUnCom>
        <vProd>${item.valorTotal.toFixed(2)}</vProd>
        <cEANTrib/>
        <uTrib>${item.unidade}</uTrib>
        <qTrib>${item.quantidade.toFixed(4)}</qTrib>
        <vUnTrib>${item.valorUnitario.toFixed(2)}</vUnTrib>
        <indTot>1</indTot>
      </prod>
      
      <imposto>
        <ICMS>
          <ICMS${item.icms.cst}>
            <orig>${item.icms.origem}</orig>
            <CST>${item.icms.cst}</CST>
            ${item.icms.aliquota ? `
            <vBC>${(item.valorTotal).toFixed(2)}</vBC>
            <pICMS>${item.icms.aliquota.toFixed(2)}</pICMS>
            <vICMS>${(item.icms.valor || 0).toFixed(2)}</vICMS>
            ` : ''}
          </ICMS${item.icms.cst}>
        </ICMS>
        
        ${item.ipi ? `
        <IPI>
          <cEnq>999</cEnq>
          <IPI${item.ipi.cst}>
            <CST>${item.ipi.cst}</CST>
            ${item.ipi.aliquota ? `
            <vBC>${item.valorTotal.toFixed(2)}</vBC>
            <pIPI>${item.ipi.aliquota.toFixed(2)}</pIPI>
            <vIPI>${(item.ipi.valor || 0).toFixed(2)}</vIPI>
            ` : ''}
          </IPI${item.ipi.cst}>
        </IPI>
        ` : ''}
        
        <PIS>
          <PIS${item.pis.cst}>
            <CST>${item.pis.cst}</CST>
            ${item.pis.aliquota ? `
            <vBC>${item.valorTotal.toFixed(2)}</vBC>
            <pPIS>${item.pis.aliquota.toFixed(2)}</pPIS>
            <vPIS>${(item.pis.valor || 0).toFixed(2)}</vPIS>
            ` : ''}
          </PIS${item.pis.cst}>
        </PIS>
        
        <COFINS>
          <COFINS${item.cofins.cst}>
            <CST>${item.cofins.cst}</CST>
            ${item.cofins.aliquota ? `
            <vBC>${item.valorTotal.toFixed(2)}</vBC>
            <pCOFINS>${item.cofins.aliquota.toFixed(2)}</pCOFINS>
            <vCOFINS>${(item.cofins.valor || 0).toFixed(2)}</vCOFINS>
            ` : ''}
          </COFINS${item.cofins.cst}>
        </COFINS>
      </imposto>
    </det>
    `).join('')}
    
    <total>
      <ICMSTot>
        <vBC>${nfeData.totais.baseCalculoIcms.toFixed(2)}</vBC>
        <vICMS>${nfeData.totais.valorIcms.toFixed(2)}</vICMS>
        <vICMSDeson>0.00</vICMSDeson>
        <vFCP>0.00</vFCP>
        <vBCST>${nfeData.totais.baseCalculoIcmsSt.toFixed(2)}</vBCST>
        <vST>${nfeData.totais.valorIcmsSt.toFixed(2)}</vST>
        <vFCPST>0.00</vFCPST>
        <vFCPSTRet>0.00</vFCPSTRet>
        <vProd>${nfeData.totais.valorTotalProdutos.toFixed(2)}</vProd>
        <vFrete>${nfeData.totais.valorFrete.toFixed(2)}</vFrete>
        <vSeg>${nfeData.totais.valorSeguro.toFixed(2)}</vSeg>
        <vDesc>${nfeData.totais.valorDesconto.toFixed(2)}</vDesc>
        <vII>${nfeData.totais.valorIi.toFixed(2)}</vII>
        <vIPI>${nfeData.totais.valorIpi.toFixed(2)}</vIPI>
        <vIPIDevol>0.00</vIPIDevol>
        <vPIS>${nfeData.totais.valorPis.toFixed(2)}</vPIS>
        <vCOFINS>${nfeData.totais.valorCofins.toFixed(2)}</vCOFINS>
        <vOutro>${nfeData.totais.valorOutrasDespesas.toFixed(2)}</vOutro>
        <vNF>${nfeData.totais.valorTotalNota.toFixed(2)}</vNF>
      </ICMSTot>
    </total>
    
    <transp>
      <modFrete>9</modFrete>
    </transp>
    
    <pag>
      <detPag>
        <indPag>0</indPag>
        <tPag>01</tPag>
        <vPag>${nfeData.totais.valorTotalNota.toFixed(2)}</vPag>
      </detPag>
    </pag>
    
    ${nfeData.informacoesComplementares || nfeData.observacoesFisco ? `
    <infAdic>
      ${nfeData.informacoesComplementares ? `<infCpl>${nfeData.informacoesComplementares}</infCpl>` : ''}
      ${nfeData.observacoesFisco ? `<infAdFisco>${nfeData.observacoesFisco}</infAdFisco>` : ''}
    </infAdic>
    ` : ''}
  </infNFe>
</NFe>`;
  }

  private criarXmlCancelamento(chaveAcesso: string, motivo: string): string {
    const numero = Date.now().toString();
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<envEventoCCe xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">
  <idLote>${numero}</idLote>
  <evento versao="1.00">
    <infEvento Id="ID110111${chaveAcesso}01">
      <cOrgao>${this.getCodigoUF(this.config.uf)}</cOrgao>
      <tpAmb>${this.config.environment === 'producao' ? '1' : '2'}</tpAmb>
      <CNPJ>${this.config.cnpj}</CNPJ>
      <chNFe>${chaveAcesso}</chNFe>
      <dhEvento>${new Date().toISOString()}</dhEvento>
      <tpEvento>110111</tpEvento>
      <nSeqEvento>1</nSeqEvento>
      <verEvento>1.00</verEvento>
      <detEvento versao="1.00">
        <descEvento>Cancelamento</descEvento>
        <nProt>123456789012345</nProt>
        <xJust>${motivo}</xJust>
      </detEvento>
    </infEvento>
  </evento>
</envEventoCCe>`;
  }

  private criarXmlConsulta(chaveAcesso: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<consSitNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <tpAmb>${this.config.environment === 'producao' ? '1' : '2'}</tpAmb>
  <xServ>CONSULTAR</xServ>
  <chNFe>${chaveAcesso}</chNFe>
</consSitNFe>`;
  }

  private async assinarXml(xml: string): Promise<string> {
    // Em produção, implementar assinatura digital com certificado A1/A3
    this.logger.log('Assinando XML da NFe');
    return xml; // Placeholder - implementar assinatura real
  }

  private async enviarParaSefaz(xmlAssinado: string): Promise<Partial<NfeResponse>> {
    try {
      const url = this.getSefazUrl('NFeAutorizacao4');
      
      // Em produção, usar SOAP para comunicação com SEFAZ
      this.logger.log('Enviando NFe para SEFAZ');
      
      // Simulação para desenvolvimento
      return {
        status: 'autorizada' as const,
        protocoloAutorizacao: '123456789012345',
      };
    } catch (error) {
      throw new Error(`Erro na comunicação com SEFAZ: ${error.message}`);
    }
  }

  private async enviarCancelamentoParaSefaz(xmlAssinado: string): Promise<{ protocoloCancelamento: string }> {
    try {
      const url = this.getSefazUrl('RecepcaoEvento4');
      
      this.logger.log('Enviando cancelamento para SEFAZ');
      
      // Simulação para desenvolvimento
      return {
        protocoloCancelamento: '123456789012345',
      };
    } catch (error) {
      throw new Error(`Erro no cancelamento via SEFAZ: ${error.message}`);
    }
  }

  private async enviarConsultaParaSefaz(xmlConsulta: string): Promise<{ status: string; situacao: string; dataProcessamento?: string }> {
    try {
      const url = this.getSefazUrl('NFeConsultaProtocolo4');
      
      this.logger.log('Consultando NFe na SEFAZ');
      
      // Simulação para desenvolvimento
      return {
        status: 'autorizada',
        situacao: 'Autorizado o uso da NFe',
        dataProcessamento: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Erro na consulta via SEFAZ: ${error.message}`);
    }
  }

  private getSefazUrl(servico: string): string {
    const urls = {
      homologacao: {
        NFeAutorizacao4: 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx',
        RecepcaoEvento4: 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nferecepcaoevento4.asmx',
        NFeConsultaProtocolo4: 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeconsultaprotocolo4.asmx',
      },
      producao: {
        NFeAutorizacao4: 'https://nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx',
        RecepcaoEvento4: 'https://nfe.fazenda.sp.gov.br/ws/nferecepcaoevento4.asmx',
        NFeConsultaProtocolo4: 'https://nfe.fazenda.sp.gov.br/ws/nfeconsultaprotocolo4.asmx',
      },
    };

    return urls[this.config.environment][servico];
  }

  private gerarChaveAcesso(nfeData: NfeData, numeroNfe: number): string {
    const uf = this.getCodigoUF(nfeData.emitente.endereco.uf);
    const dataEmissao = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const cnpj = nfeData.emitente.cnpj;
    const modelo = '55';
    const serie = '001';
    const numero = numeroNfe.toString().padStart(9, '0');
    const codigoNumerico = Math.floor(Math.random() * 99999999).toString().padStart(8, '0');
    
    const chave = `${uf}${dataEmissao}${cnpj}${modelo}${serie}${numero}${codigoNumerico}`;
    const dv = this.calcularDigitoVerificador(chave);
    
    return `${chave}${dv}`;
  }

  private getCodigoUF(uf: string): string {
    const codigos = {
      'AC': '12', 'AL': '17', 'AP': '16', 'AM': '23', 'BA': '29', 'CE': '23',
      'DF': '53', 'ES': '32', 'GO': '52', 'MA': '21', 'MT': '51', 'MS': '50',
      'MG': '31', 'PA': '15', 'PB': '25', 'PR': '41', 'PE': '26', 'PI': '22',
      'RJ': '33', 'RN': '24', 'RS': '43', 'RO': '11', 'RR': '14', 'SC': '42',
      'SP': '35', 'SE': '28', 'TO': '17'
    };
    return codigos[uf] || '35';
  }

  private calcularDigitoVerificador(chave: string): string {
    let soma = 0;
    let peso = 2;
    
    for (let i = chave.length - 1; i >= 0; i--) {
      soma += parseInt(chave.charAt(i)) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    
    const resto = soma % 11;
    return resto < 2 ? '0' : (11 - resto).toString();
  }
}