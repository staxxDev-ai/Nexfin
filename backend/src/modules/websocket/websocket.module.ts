import { Module, Global } from '@nestjs/common';
import { BalanceGateway } from './balance.gateway';

@Global()
@Module({
  providers: [BalanceGateway],
  exports: [BalanceGateway],
})
export class WebsocketModule {}
