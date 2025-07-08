import { ProductRecommendation } from "./recomendations";

export interface Wishlist {
  id: string;
  name: string;
  age: number;
  gender: string;
  interests: string;
  max_price?: number;
  ai_support: boolean;
  bought_by: string;
  wish_list: ProductRecommendation[];
}
