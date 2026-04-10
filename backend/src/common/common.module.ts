import { Module, Global } from '@nestjs/common';
import { EncryptionService } from './encryption/encryption.service';
import { AuditService } from './audit/audit.service';
import { MailService } from './services/mail.service';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [EncryptionService, AuditService, MailService],
  exports: [EncryptionService, AuditService, MailService],
})
export class CommonModule {}
