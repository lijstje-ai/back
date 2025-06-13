import { forwardRef, Module } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';
import { OpenAiModule } from 'src/openai/openai.module';
import { ConfigModule } from '@nestjs/config';
import { BolModule } from 'src/bol/bol.module';

@Module({
  imports: [OpenAiModule, ConfigModule, forwardRef(() => BolModule)],
  controllers: [WishlistController],
  providers: [WishlistService],
  exports: [WishlistService],
})
export class WishlistModule {}
