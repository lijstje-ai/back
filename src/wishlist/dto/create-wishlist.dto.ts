import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
  Max,
} from "class-validator";

export class CreateWishlistDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  @Max(120)
  age: number;

  @IsString()
  gender: string;

  @IsString()
  interests: string;

  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @IsBoolean()
  aiSupport: boolean;
}
