import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { BolService } from "./bol.service";

@Controller("bol")
export class BolController {
  constructor(private readonly bolService: BolService) {}

  @Get("search")
  async search(@Query("q") query: string) {
    return this.bolService.searchProducts(query);
  }
  @Post("by-url")
  getByUrl(@Body("url") url: string, @Body("wishlistId") wishlistId: string) {
    return this.bolService.getProductByUrlAndAddToWishlist(url, wishlistId);
  }
  @Get("preview-by-url")
  async previewByUrl(@Query("url") url: string) {
    return this.bolService.getProductByUrl(url);
  }
}
