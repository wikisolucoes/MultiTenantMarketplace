import { db } from "../db";
import { storage } from "../storage";
import { nfeConfigurations, nfeDocuments, orders, tenants } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface NfeData {
  orderId: number;
  customerDocument: string;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  customerCity: string;
  customerState: string;
  customerZipCode: string;
  items: Array<{
    productId: number;
    name: string;
    quantity: number;
    unitPrice: number;
    ncm?: string;
    cfop?: string;
    icmsCst?: string;
    icmsRate?: number;
  }>;
}

export interface NfeResult {
  success: boolean;
  nfeKey?: string;
  nfeNumber?: number;
  protocol?: string;
  xml?: string;
  error?: string;
}

export class NfeService {
  /**
   * Check if tenant has active NF-e subscription
   */
  static async hasNfeSubscription(tenantId: number): Promise<boolean> {
    try {
      const subscription = await storage.getTenantPluginSubscriptions(tenantId);
      return subscription.some(sub => 
        sub.pluginId === 1 && // NF-e plugin ID
        sub.status === 'active'
      );
    } catch (error) {
      console.error("Error checking NF-e subscription:", error);
      return false;
    }
  }

  /**
   * Get NF-e configuration for tenant
   */
  static async getNfeConfiguration(tenantId: number) {
    const [config] = await db
      .select()
      .from(nfeConfigurations)
      .where(eq(nfeConfigurations.tenantId, tenantId));
    
    return config;
  }

  /**
   * Generate NF-e for an order
   */
  static async generateNfe(tenantId: number, nfeData: NfeData): Promise<NfeResult> {
    try {
      // Check if tenant has NF-e subscription
      const hasSubscription = await this.hasNfeSubscription(tenantId);
      if (!hasSubscription) {
        return {
          success: false,
          error: "NF-e module not active. Please subscribe to the NF-e plugin."
        };
      }

      // Get NF-e configuration
      const config = await this.getNfeConfiguration(tenantId);
      if (!config || !config.isActive) {
        return {
          success: false,
          error: "NF-e configuration not found or inactive. Please configure NF-e settings."
        };
      }

      // Get tenant data
      const tenant = await storage.getTenant(tenantId);
      if (!tenant) {
        return {
          success: false,
          error: "Tenant not found"
        };
      }

      // Generate NF-e number
      const nfeNumber = config.nextNumber;
      const nfeKey = this.generateNfeKey(tenant.cnpj || '', config.serie, nfeNumber);

      // Build NF-e XML (simplified for demo)
      const xml = this.buildNfeXml(tenant, config, nfeData, nfeNumber, nfeKey);

      // In a real implementation, this would call the SEFAZ API
      // For demo purposes, we simulate a successful response
      const protocol = `135${Date.now()}`;

      // Save NF-e document
      const [nfeDocument] = await db
        .insert(nfeDocuments)
        .values({
          tenantId,
          orderId: nfeData.orderId,
          nfeKey,
          nfeNumber,
          serie: config.serie,
          xml,
          status: 'authorized',
          protocol,
          issuedAt: new Date(),
        })
        .returning();

      // Update next NF-e number
      await db
        .update(nfeConfigurations)
        .set({ nextNumber: nfeNumber + 1 })
        .where(eq(nfeConfigurations.tenantId, tenantId));

      // Update order with NF-e information
      await db
        .update(orders)
        .set({
          nfeKey,
          nfeNumber: nfeNumber.toString(),
          nfeStatus: 'issued',
          nfeXml: xml,
          nfeProtocol: protocol,
        })
        .where(eq(orders.id, nfeData.orderId));

      return {
        success: true,
        nfeKey,
        nfeNumber,
        protocol,
        xml,
      };
    } catch (error: any) {
      console.error("Error generating NF-e:", error);
      return {
        success: false,
        error: error.message || "Error generating NF-e"
      };
    }
  }

  /**
   * Generate NF-e key (44 digits)
   */
  private static generateNfeKey(cnpj: string, serie: number, number: number): string {
    const uf = '35'; // São Paulo (example)
    const year = new Date().getFullYear().toString().slice(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const cnpjNumbers = cnpj.replace(/\D/g, '');
    const model = '55'; // NF-e model
    const serieStr = serie.toString().padStart(3, '0');
    const numberStr = number.toString().padStart(9, '0');
    const emissionType = '1'; // Normal emission
    const randomCode = Math.random().toString().slice(2, 10);
    
    const baseKey = uf + year + month + cnpjNumbers + model + serieStr + numberStr + emissionType + randomCode;
    const checkDigit = this.calculateCheckDigit(baseKey);
    
    return baseKey + checkDigit;
  }

  /**
   * Calculate check digit for NF-e key
   */
  private static calculateCheckDigit(key: string): string {
    const weights = [4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    
    let sum = 0;
    for (let i = 0; i < key.length; i++) {
      sum += parseInt(key[i]) * weights[i];
    }
    
    const remainder = sum % 11;
    return remainder < 2 ? '0' : (11 - remainder).toString();
  }

  /**
   * Build NF-e XML (simplified)
   */
  private static buildNfeXml(tenant: any, config: any, nfeData: NfeData, nfeNumber: number, nfeKey: string): string {
    const now = new Date();
    const dateTime = now.toISOString().slice(0, 19);
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
    <infNFe Id="NFe${nfeKey}" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <cNF>${nfeKey.slice(-8)}</cNF>
        <natOp>Venda</natOp>
        <mod>55</mod>
        <serie>${config.serie}</serie>
        <nNF>${nfeNumber}</nNF>
        <dhEmi>${dateTime}</dhEmi>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
        <cMunFG>3550308</cMunFG>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <cDV>${nfeKey.slice(-1)}</cDV>
        <tpAmb>${config.environment === 'producao' ? '1' : '2'}</tpAmb>
        <finNFe>1</finNFe>
        <indFinal>1</indFinal>
        <indPres>0</indPres>
      </ide>
      <emit>
        <CNPJ>${tenant.cnpj?.replace(/\D/g, '')}</CNPJ>
        <xNome>${tenant.corporateName || tenant.name}</xNome>
        <enderEmit>
          <xLgr>${tenant.address || ''}</xLgr>
          <nro>${tenant.addressNumber || 'S/N'}</nro>
          <xBairro>${tenant.neighborhood || ''}</xBairro>
          <cMun>3550308</cMun>
          <xMun>${tenant.city || 'São Paulo'}</xMun>
          <UF>${tenant.state || 'SP'}</UF>
          <CEP>${tenant.zipCode?.replace(/\D/g, '') || ''}</CEP>
        </enderEmit>
        <IE>${tenant.stateRegistration || ''}</IE>
        <CRT>1</CRT>
      </emit>
      <dest>
        <CPF>${nfeData.customerDocument.replace(/\D/g, '')}</CPF>
        <xNome>${nfeData.customerName}</xNome>
        <enderDest>
          <xLgr>${nfeData.customerAddress}</xLgr>
          <nro>S/N</nro>
          <xBairro>Centro</xBairro>
          <cMun>3550308</cMun>
          <xMun>${nfeData.customerCity}</xMun>
          <UF>${nfeData.customerState}</UF>
          <CEP>${nfeData.customerZipCode.replace(/\D/g, '')}</CEP>
        </enderDest>
        <indIEDest>9</indIEDest>
        <email>${nfeData.customerEmail}</email>
      </dest>
      ${nfeData.items.map((item, index) => `
      <det nItem="${index + 1}">
        <prod>
          <cProd>${item.productId}</cProd>
          <cEAN>SEM GTIN</cEAN>
          <xProd>${item.name}</xProd>
          <NCM>${item.ncm || '00000000'}</NCM>
          <CFOP>${item.cfop || '5102'}</CFOP>
          <uCom>UN</uCom>
          <qCom>${item.quantity}</qCom>
          <vUnCom>${item.unitPrice.toFixed(2)}</vUnCom>
          <vProd>${(item.quantity * item.unitPrice).toFixed(2)}</vProd>
          <cEANTrib>SEM GTIN</cEANTrib>
          <uTrib>UN</uTrib>
          <qTrib>${item.quantity}</qTrib>
          <vUnTrib>${item.unitPrice.toFixed(2)}</vUnTrib>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <ICMS>
            <ICMS${item.icmsCst || '102'}>
              <orig>0</orig>
              <CST>${item.icmsCst || '102'}</CST>
            </ICMS${item.icmsCst || '102'}>
          </ICMS>
        </imposto>
      </det>`).join('')}
      <total>
        <ICMSTot>
          <vBC>0.00</vBC>
          <vICMS>0.00</vICMS>
          <vICMSDeson>0.00</vICMSDeson>
          <vBCST>0.00</vBCST>
          <vST>0.00</vST>
          <vProd>${nfeData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2)}</vProd>
          <vFrete>0.00</vFrete>
          <vSeg>0.00</vSeg>
          <vDesc>0.00</vDesc>
          <vII>0.00</vII>
          <vIPI>0.00</vIPI>
          <vPIS>0.00</vPIS>
          <vCOFINS>0.00</vCOFINS>
          <vOutro>0.00</vOutro>
          <vNF>${nfeData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2)}</vNF>
        </ICMSTot>
      </total>
      <transp>
        <modFrete>9</modFrete>
      </transp>
      <pag>
        <detPag>
          <tPag>01</tPag>
          <vPag>${nfeData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2)}</vPag>
        </detPag>
      </pag>
    </infNFe>
  </NFe>
</nfeProc>`;
  }

  /**
   * Cancel NF-e
   */
  static async cancelNfe(tenantId: number, nfeKey: string, reason: string): Promise<NfeResult> {
    try {
      const hasSubscription = await this.hasNfeSubscription(tenantId);
      if (!hasSubscription) {
        return {
          success: false,
          error: "NF-e module not active. Please subscribe to the NF-e plugin."
        };
      }

      // In a real implementation, this would call SEFAZ cancellation API
      await db
        .update(nfeDocuments)
        .set({ 
          status: 'cancelled',
          errorMessage: `Cancelled: ${reason}`,
        })
        .where(eq(nfeDocuments.nfeKey, nfeKey));

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}