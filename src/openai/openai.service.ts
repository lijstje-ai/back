import { Injectable } from "@nestjs/common";
import OpenAI from "openai";
import { ConfigService } from "@nestjs/config";
import { CreateWishlistDto } from "../wishlist/dto/create-wishlist.dto";
import {
  userPrompt,
  getSystemPromptByAttemptsRemaining,
} from "../template/gptPromptTemplate";
import { BolService } from "../bol/bol.service";

@Injectable()
export class OpenAiService {
  private openai: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly bolService: BolService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>("OPENAI_API_KEY"),
    });
  }

  async generateProductSuggestions(
    dto: CreateWishlistDto,
    attemptsRemaining: number = 5,
  ): Promise<string[]> {
    const systemPromptText =
      getSystemPromptByAttemptsRemaining(attemptsRemaining);
    const userPromptText = userPrompt(dto);

    const res = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPromptText },
        { role: "user", content: userPromptText },
      ],
      temperature: 0.7,
    });

    const content = res.choices[0].message.content?.trim();
    if (!content) return [];

    return content.split(",").map((item) => item.trim());
  }

  async generateProductRecommendations(
    dto: CreateWishlistDto,
    attemptsRemaining: number = 5,
  ) {
    const gptSuggestions = await this.generateProductSuggestions(
      dto,
      attemptsRemaining,
    );

    const bolProducts = await this.bolService.searchMultipleFromGptInput(
      gptSuggestions.join(","),
      dto.maxPrice,
    );

    return bolProducts;
  }
}
