import { forwardRef, Module } from "@nestjs/common";
import { WishlistService } from "./wishlist.service";
import { WishlistController } from "./wishlist.controller";
import { OpenAiModule } from "src/openai/openai.module";
import { ConfigModule } from "@nestjs/config";
import { BolModule } from "src/bol/bol.module";
import { RecaptchaService } from "src/recaptcha/recaptcha.service";

@Module({
  imports: [OpenAiModule, ConfigModule, forwardRef(() => BolModule)],
  controllers: [WishlistController],
  providers: [WishlistService, RecaptchaService],
  exports: [WishlistService],
})
export class WishlistModule {}
