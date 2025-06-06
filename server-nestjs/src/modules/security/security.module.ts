import { Module } from '@nestjs/common';
import { SecurityService } from './security.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  providers: [SecurityService],
  exports: [SecurityService]
})
export class SecurityModule {}