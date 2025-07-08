import { IsString } from "class-validator";

export class UpdateBoughtByDto {
  @IsString()
  buyer: string;
}
