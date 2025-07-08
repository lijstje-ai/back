import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { BolModule } from "../bol/bol.module";
import { OpenAiService } from "./openai.service";

@Module({
  imports: [ConfigModule, BolModule],
  providers: [OpenAiService],
  exports: [OpenAiService],
})
export class OpenAiModule {}
