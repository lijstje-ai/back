import { CreateWishlistDto } from 'src/wishlist/dto/create-wishlist.dto';

export const prompt = (dto: CreateWishlistDto) => {
  const { age, gender, interests, maxPrice } = dto;
  return `You are a gift recommendation engine connected to bol.com.

Given the following person:
- Age: ${age}
- Gender: ${gender}
- Interests: ${interests}
- Budget: ${maxPrice ?? 'no budget specified'} euros maximum

Your task is to generate a list of 10 gift ideas that are likely available on bol.com, matching their interests and staying within the given budget.

Each idea should be expressed as a **general search phrase** (e.g. "wireless headphones", "lego set", "kitchen gadget") — not a specific product name or brand.

Avoid long or overly specific names like "Sony WH-1000XM5 noise cancelling headphones" or "LEGO 42128 Heavy-duty Tow Truck". Use broader terms that people would type into a search bar.

Return the list strictly as a **single-line string**, **comma-separated**, for example:
"wireless headphones, lego set, fitness tracker, photo printer, star wars board game, art supplies, puzzle game, bluetooth speaker, board game, outdoor toy"

Do not include bullet points, numbering, explanations, or extra formatting. Only output the comma-separated list.`;
};
