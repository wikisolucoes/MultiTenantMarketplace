import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { 
  CelcoinService, 
  CelcoinPixPaymentResponse, 
  CelcoinBoletoResponse, 
  CelcoinAccountBalance, 
  CelcoinTransaction 
} from './celcoin.service';
import { CreatePixPaymentDto } from './dto/create-pix-payment.dto';
import { CreateBoletoDto } from './dto/create-boleto.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('celcoin')
@UseGuards(JwtAuthGuard)
export class CelcoinController {
  constructor(private readonly celcoinService: CelcoinService) {}

  @Post('pix/payment')
  createPixPayment(@Body() createPixPaymentDto: CreatePixPaymentDto): Promise<CelcoinPixPaymentResponse> {
    return this.celcoinService.createPixPayment(createPixPaymentDto);
  }

  @Get('pix/payment/:transactionId')
  getPixPaymentStatus(@Param('transactionId') transactionId: string): Promise<any> {
    return this.celcoinService.getPixPaymentStatus(transactionId);
  }

  @Post('boleto/payment')
  createBoleto(@Body() createBoletoDto: CreateBoletoDto): Promise<CelcoinBoletoResponse> {
    return this.celcoinService.createBoleto(createBoletoDto);
  }

  @Get('boleto/payment/:transactionId')
  getBoletoStatus(@Param('transactionId') transactionId: string): Promise<any> {
    return this.celcoinService.getBoletoStatus(transactionId);
  }

  @Get('account/balance')
  getAccountBalance(): Promise<CelcoinAccountBalance> {
    return this.celcoinService.getAccountBalance();
  }

  @Get('account/statement')
  getAccountStatement(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ): Promise<CelcoinTransaction[]> {
    return this.celcoinService.getAccountStatement(startDate, endDate);
  }

  @Post('withdrawal')
  createWithdrawal(
    @Body() body: {
      amount: number;
      bankAccount: {
        bank: string;
        agency: string;
        account: string;
        accountDigit: string;
        document: string;
        name: string;
      };
    }
  ) {
    return this.celcoinService.createWithdrawal(body.amount, body.bankAccount);
  }

  @Get('withdrawal/:withdrawalId')
  getWithdrawalStatus(@Param('withdrawalId') withdrawalId: string) {
    return this.celcoinService.getWithdrawalStatus(withdrawalId);
  }

  @Post('validate/cpf')
  validateCPF(@Body() body: { cpf: string }) {
    return {
      valid: this.celcoinService.validateCPF(body.cpf)
    };
  }

  @Post('validate/cnpj')
  validateCNPJ(@Body() body: { cnpj: string }) {
    return {
      valid: this.celcoinService.validateCNPJ(body.cnpj)
    };
  }
}