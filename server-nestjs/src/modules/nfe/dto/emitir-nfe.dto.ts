import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class EnderecoDto {
  @IsString()
  @IsNotEmpty()
  logradouro: string;

  @IsString()
  @IsNotEmpty()
  numero: string;

  @IsString()
  @IsOptional()
  complemento?: string;

  @IsString()
  @IsNotEmpty()
  bairro: string;

  @IsString()
  @IsNotEmpty()
  codigoMunicipio: string;

  @IsString()
  @IsNotEmpty()
  nomeMunicipio: string;

  @IsString()
  @IsNotEmpty()
  uf: string;

  @IsString()
  @IsNotEmpty()
  cep: string;
}

export class EmitenteDto {
  @IsString()
  @IsNotEmpty()
  cnpj: string;

  @IsString()
  @IsNotEmpty()
  razaoSocial: string;

  @IsString()
  @IsOptional()
  nomeFantasia?: string;

  @IsString()
  @IsNotEmpty()
  inscricaoEstadual: string;

  @ValidateNested()
  @Type(() => EnderecoDto)
  endereco: EnderecoDto;
}

export class DestinatarioDto {
  @IsString()
  @IsNotEmpty()
  cnpjCpf: string;

  @IsString()
  @IsNotEmpty()
  razaoSocial: string;

  @IsString()
  @IsOptional()
  inscricaoEstadual?: string;

  @ValidateNested()
  @Type(() => EnderecoDto)
  endereco: EnderecoDto;
}

export class IcmsDto {
  @IsString()
  @IsNotEmpty()
  origem: string;

  @IsString()
  @IsNotEmpty()
  cst: string;

  @IsNumber()
  @IsOptional()
  aliquota?: number;

  @IsNumber()
  @IsOptional()
  valor?: number;
}

export class IpiDto {
  @IsString()
  @IsNotEmpty()
  cst: string;

  @IsNumber()
  @IsOptional()
  aliquota?: number;

  @IsNumber()
  @IsOptional()
  valor?: number;
}

export class PisDto {
  @IsString()
  @IsNotEmpty()
  cst: string;

  @IsNumber()
  @IsOptional()
  aliquota?: number;

  @IsNumber()
  @IsOptional()
  valor?: number;
}

export class CofinsDto {
  @IsString()
  @IsNotEmpty()
  cst: string;

  @IsNumber()
  @IsOptional()
  aliquota?: number;

  @IsNumber()
  @IsOptional()
  valor?: number;
}

export class ItemNfeDto {
  @IsNumber()
  numero: number;

  @IsString()
  @IsNotEmpty()
  codigo: string;

  @IsString()
  @IsNotEmpty()
  descricao: string;

  @IsString()
  @IsNotEmpty()
  ncm: string;

  @IsString()
  @IsOptional()
  cest?: string;

  @IsString()
  @IsNotEmpty()
  cfop: string;

  @IsString()
  @IsNotEmpty()
  unidade: string;

  @IsNumber()
  quantidade: number;

  @IsNumber()
  valorUnitario: number;

  @IsNumber()
  valorTotal: number;

  @ValidateNested()
  @Type(() => IcmsDto)
  icms: IcmsDto;

  @ValidateNested()
  @Type(() => IpiDto)
  @IsOptional()
  ipi?: IpiDto;

  @ValidateNested()
  @Type(() => PisDto)
  pis: PisDto;

  @ValidateNested()
  @Type(() => CofinsDto)
  cofins: CofinsDto;
}

export class TotaisDto {
  @IsNumber()
  baseCalculoIcms: number;

  @IsNumber()
  valorIcms: number;

  @IsNumber()
  baseCalculoIcmsSt: number;

  @IsNumber()
  valorIcmsSt: number;

  @IsNumber()
  valorTotalProdutos: number;

  @IsNumber()
  valorFrete: number;

  @IsNumber()
  valorSeguro: number;

  @IsNumber()
  valorDesconto: number;

  @IsNumber()
  valorIi: number;

  @IsNumber()
  valorIpi: number;

  @IsNumber()
  valorPis: number;

  @IsNumber()
  valorCofins: number;

  @IsNumber()
  valorOutrasDespesas: number;

  @IsNumber()
  valorTotalNota: number;
}

export class EmitirNfeDto {
  @ValidateNested()
  @Type(() => EmitenteDto)
  emitente: EmitenteDto;

  @ValidateNested()
  @Type(() => DestinatarioDto)
  destinatario: DestinatarioDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemNfeDto)
  itens: ItemNfeDto[];

  @ValidateNested()
  @Type(() => TotaisDto)
  totais: TotaisDto;

  @IsString()
  @IsOptional()
  informacoesComplementares?: string;

  @IsString()
  @IsOptional()
  observacoesFisco?: string;
}