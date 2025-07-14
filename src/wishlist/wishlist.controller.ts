import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from "@nestjs/common";
import { WishlistService } from "./wishlist.service";
import { CreateWishlistDto } from "./dto/create-wishlist.dto";
import { UpdateWishlistDto } from "./dto/update-wishlist.dto";
import { UpdateBoughtByDto } from "./dto/update-bought-by.dto";
import { UpdateWishlistInfoDto } from "./dto/update-wishlist-info.dto";

@Controller("wishlist")
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.wishlistService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateWishlistDto) {
    return this.wishlistService.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateWishlistDto) {
    return this.wishlistService.update(id, dto);
  }

  @Patch(":wishlistId/items/:itemId/bought-by")
  updateBoughtBy(
    @Param("wishlistId") wishlistId: string,
    @Param("itemId") itemId: string,
    @Body() dto: UpdateBoughtByDto,
  ) {
    return this.wishlistService.updateBoughtBy(wishlistId, itemId, dto.buyer);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.wishlistService.remove(id);
  }

  @Delete(":wishlistId/items/:itemId")
  removeWishListItem(
    @Param("wishlistId") wishlistId: string,
    @Param("itemId") itemId: string,
  ) {
    return this.wishlistService.removeWishListItem(wishlistId, itemId);
  }

  // Update basic wishlist info
  @Patch(":id/info")
  updateInfo(@Param("id") id: string, @Body() dto: UpdateWishlistInfoDto) {
    return this.wishlistService.updateInfo(id, dto);
  }

  @Patch("/update-generated-list/:id")
  async updateGeneratedList(@Param("id") id: string) {
    return await this.wishlistService.updateGeneratedList(id);
  }
}
