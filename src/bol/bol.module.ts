import { forwardRef, Module } from "@nestjs/common";
import { BolService } from "./bol.service";
import { BolController } from "./bol.controller";
import { WishlistModule } from "src/wishlist/wishlist.module";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [forwardRef(() => WishlistModule), ConfigModule],
  controllers: [BolController],
  providers: [BolService],
  exports: [BolService],
})
export class BolModule {}
