import {
  IsString,
  IsOptional,
  IsNumber,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProductRecommendationUpdatedDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsString()
  link: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsUUID()
  id: string;
}

export class UpdateWishlistDto {
  @ValidateNested()
  @Type(
    () =>
      ProductRecommendationUpdatedDto as new () => ProductRecommendationUpdatedDto,
  )
  wish_item: ProductRecommendationUpdatedDto;
}
