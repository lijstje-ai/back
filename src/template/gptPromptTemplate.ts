import { CreateWishlistDto } from "src/wishlist/dto/create-wishlist.dto";

export const prompt = (dto: CreateWishlistDto) => {
  const { age, gender, interests, maxPrice } = dto;
  return `The person to receive the gift is a ${age}-year-old ${gender}. Their interests are: ${interests}. The maximum budget is ${maxPrice} euros.
`;
};
