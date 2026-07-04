import { Module } from '@nestjs/common';
import { StreamGateway } from './stream.gateway';
import { ExchangeModule } from '../common/exchange.module';

@Module({ providers: [StreamGateway], imports: [ExchangeModule] })
export class StreamModule {}
