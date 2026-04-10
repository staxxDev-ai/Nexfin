import { Module } from '@nestjs/common';
import { OpenFinanceService } from './open-finance.service';
import { OpenFinanceController } from './open-finance.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [OpenFinanceController],
  providers: [OpenFinanceService],
  exports: [OpenFinanceService],
})
export class AccountsModule {}
