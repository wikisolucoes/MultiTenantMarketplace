import { z } from "zod";

// CPF validation
function validateCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]/g, "");
  
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf[i]) * (10 - i);
  }
  
  let remainder = sum % 11;
  let digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  if (parseInt(cpf[9]) !== digit1) {
    return false;
  }

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf[i]) * (11 - i);
  }
  
  remainder = sum % 11;
  let digit2 = remainder < 2 ? 0 : 11 - remainder;
  
  return parseInt(cpf[10]) === digit2;
}

// CNPJ validation
function validateCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/[^\d]/g, "");
  
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) {
    return false;
  }

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj[i]) * weights1[i];
  }
  
  let remainder = sum % 11;
  let digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  if (parseInt(cnpj[12]) !== digit1) {
    return false;
  }

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj[i]) * weights2[i];
  }
  
  remainder = sum % 11;
  let digit2 = remainder < 2 ? 0 : 11 - remainder;
  
  return parseInt(cnpj[13]) === digit2;
}

export class ValidationService {
  static validateDocument(document: string, type: "cpf" | "cnpj"): boolean {
    if (type === "cpf") {
      return validateCPF(document);
    } else if (type === "cnpj") {
      return validateCNPJ(document);
    }
    return false;
  }

  static async validateDocumentWithReceita(document: string, type: "cpf" | "cnpj"): Promise<{
    valid: boolean;
    name?: string;
    status?: string;
  }> {
    // Mock implementation - in production, integrate with Receita Federal WS
    const isValid = this.validateDocument(document, type);
    
    if (!isValid) {
      return { valid: false };
    }

    // Mock response simulating Receita WS
    return {
      valid: true,
      name: type === "cpf" ? "João da Silva" : "Empresa Exemplo LTDA",
      status: "REGULAR",
    };
  }

  static formatCPF(cpf: string): string {
    cpf = cpf.replace(/[^\d]/g, "");
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  static formatCNPJ(cnpj: string): string {
    cnpj = cnpj.replace(/[^\d]/g, "");
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }

  static validateBankAccount(bank: string, agency: string, account: string): boolean {
    // Basic validation - in production, integrate with bank APIs
    return bank.length >= 3 && agency.length >= 4 && account.length >= 5;
  }
}
