import { Type } from "class-transformer";
import {
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
  IsNumber,
} from "class-validator";

export class ProductRecommendationDto {
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

  @IsOptional()
  @IsString()
  bought_by?: string;
}

export class UpdateFullWishlistDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductRecommendationDto)
  wish_list: ProductRecommendationDto[];
}
