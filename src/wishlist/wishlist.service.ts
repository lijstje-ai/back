import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { CreateWishlistDto } from "./dto/create-wishlist.dto";
import { SupabaseClient } from "@supabase/supabase-js";
import { OpenAiService } from "../openai/openai.service";
import { ProductRecommendation } from "./types/recomendations";
import { Wishlist } from "./types/wishlist";
import {
  ProductRecommendationUpdatedDto,
  UpdateWishlistDto,
} from "./dto/update-wishlist.dto";
import { RecaptchaService } from "src/recaptcha/recaptcha.service";

@Injectable()
export class WishlistService {
  constructor(
    @Inject("SUPABASE_CLIENT") private readonly supabase: SupabaseClient,
    private readonly openAiService: OpenAiService,
    private readonly recaptchaService: RecaptchaService,
  ) {}

  async create(dto: CreateWishlistDto) {
    if (dto.recaptchaToken)
      await this.recaptchaService.validate(dto.recaptchaToken);

    let recommendations: ProductRecommendation[] = [];

    if (dto.aiSupport) {
      recommendations =
        await this.openAiService.generateProductRecommendations(dto);
    }

    const { data, error } = await this.supabase
      .from("wishlists")
      .insert([
        {
          name: dto.name,
          age: dto.age,
          gender: dto.gender,
          interests: dto.interests,
          max_price: dto.maxPrice,
          ai_support: dto.aiSupport,
          bought_by: "",
          wish_list: [],
        },
      ])
      .select();

    if (error) throw new Error(error.message);

    const wishlist = data[0] as Wishlist;

    if (recommendations.length > 0 && dto.aiSupport) {
      const insertPayload = recommendations.map((rec) => ({
        title: rec.title,
        image: rec.image,
        link: rec.link,
        price: rec.price,
        wishlist_id: wishlist.id,
        rating: rec.rating,
      }));

      const { error: recError } = await this.supabase
        .from("recommendations")
        .insert(insertPayload);

      if (recError) {
        console.warn("Failed to save recommendations:", recError.message);
      }

      await this.supabase
        .from("wishlists")
        .update({ generate_attempts: wishlist.generate_attempts - 1 })
        .eq("id", wishlist.id);
    }

    return { id: wishlist.id };
  }

  async findOne(id: string): Promise<{
    wishlist: Wishlist;
    recommendations: ProductRecommendation[];
  }> {
    const response = await this.supabase
      .from("wishlists")
      .select("*")
      .eq("id", id)
      .single();

    if (response.error) throw new Error(response.error.message);

    const wishlist = response.data as Wishlist;

    let recommendations: ProductRecommendation[] = [];

    if (wishlist.ai_support) {
      const recRes = await this.supabase
        .from("recommendations")
        .select("*")
        .eq("wishlist_id", wishlist.id);

      if (recRes.error) {
        console.warn("Failed to load recommendations:", recRes.error.message);
      } else {
        recommendations = recRes.data as ProductRecommendation[];
      }
    }

    return {
      wishlist,
      recommendations,
    };
  }

  async update(
    id: string,
    dto: UpdateWishlistDto,
  ): Promise<{ success: boolean }> {
    if (!id) throw new Error("Wishlist ID is required");

    const { data, error: fetchError } = await this.supabase
      .from("wishlists")
      .select("wish_list")
      .eq("id", id)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch wishlist: ${fetchError.message}`);
    }

    const currentWishList = Array.isArray(data.wish_list) ? data.wish_list : [];

    const newItem = {
      ...dto.wish_item,
      bought_by: "",
    };

    if (!dto.wish_item.id) {
      newItem.id = crypto.randomUUID();
    }

    const updatedWishList = [...currentWishList, newItem];

    const { error: updateError } = await this.supabase
      .from("wishlists")
      .update({ wish_list: updatedWishList })
      .eq("id", id);

    if (updateError) {
      throw new Error(`Failed to update wish_list: ${updateError.message}`);
    }

    return { success: true };
  }

  async updateBoughtBy(
    wishlistId: string,
    itemId: string,
    buyer: string,
  ): Promise<{ success: true }> {
    if (!wishlistId || !itemId || !buyer) {
      throw new Error("wishlistId, itemId, and buyer are required");
    }

    const { data, error: fetchError } = await this.supabase
      .from("wishlists")
      .select("wish_list")
      .eq("id", wishlistId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch wishlist: ${fetchError.message}`);
    }

    const currentWishList = (data?.wish_list ??
      []) as ProductRecommendationUpdatedDto[];

    const updatedWishList = currentWishList.map((item) => {
      if (item?.id === itemId) {
        return {
          ...item,
          bought_by: buyer,
        };
      }
      return item;
    });

    const { error: updateError } = await this.supabase
      .from("wishlists")
      .update({ wish_list: updatedWishList })
      .eq("id", wishlistId);

    if (updateError) {
      throw new Error(`Failed to update bought_by: ${updateError.message}`);
    }

    return { success: true };
  }

  async remove(id: string): Promise<{ success: true }> {
    const { error: recError } = await this.supabase
      .from("recommendations")
      .delete()
      .eq("wishlist_id", id);

    if (recError) {
      throw new Error(`Failed to delete recommendations: ${recError.message}`);
    }

    const { error: wishlistError } = await this.supabase
      .from("wishlists")
      .delete()
      .eq("id", id);

    if (wishlistError) {
      throw new Error(`Failed to delete wishlist: ${wishlistError.message}`);
    }

    return { success: true };
  }

  async removeWishListItem(
    wishlistId: string,
    itemId: string,
  ): Promise<{ success: true }> {
    const { data, error: fetchError } = await this.supabase
      .from("wishlists")
      .select("wish_list")
      .eq("id", wishlistId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch wishlist: ${fetchError.message}`);
    }

    const currentWishList = (data?.wish_list ??
      []) as ProductRecommendationUpdatedDto[];

    const updatedWishList = currentWishList.filter(
      (item) => item.id !== itemId,
    );

    const { error: updateError } = await this.supabase
      .from("wishlists")
      .update({ wish_list: updatedWishList })
      .eq("id", wishlistId);

    const { error: deleteError } = await this.supabase
      .from("recommendations")
      .delete()
      .eq("id", itemId);

    if (updateError) {
      throw new Error(`Failed to update wishlist: ${updateError.message}`);
    }

    return { success: true };
  }

  async updateInfo(
    id: string,
    dto: Partial<{
      name: string;
      age: number;
      gender: string;
      interests: string;
      maxPrice: number;
      aiSupport: boolean;
    }>,
  ) {
    const { aiSupport, maxPrice, ...rest } = dto;
    const updateData = {
      ...rest,
      ai_support: aiSupport,
      max_price: maxPrice,
    };

    const { error: wishlistUpdateError } = await this.supabase
      .from("wishlists")
      .update(updateData)
      .eq("id", id);

    if (wishlistUpdateError) {
      throw new Error(
        `Failed to update wishlist info: ${wishlistUpdateError.message}`,
      );
    }

    if (aiSupport) await this.updateGeneratedList(id, true);

    return { success: true };
  }

  async updateGeneratedList(id: string, isAttempt = true) {
    const { data: wishList } = await this.supabase
      .from("wishlists")
      .select("*")
      .eq("id", id)
      .single();

    if (!wishList) {
      throw new NotFoundException("Wishlist no found");
    }

    const attemptsRemaining = wishList.generate_attempts;

    if (isAttempt && attemptsRemaining <= 0) {
      const { data: existingRecommendations, error: recFetchError } =
        await this.supabase
          .from("recommendations")
          .select("*")
          .eq("wishlist_id", id);

      if (recFetchError) {
        throw new InternalServerErrorException(
          `Failed to load existing recommendations: ${recFetchError.message}`,
        );
      }

      return {
        success: true,
        recommendations: existingRecommendations ?? [],
        reusedPrevious: true,
        attemptsRemaining,
      };
    }

    const recommendations =
      await this.openAiService.generateProductRecommendations(
        {
          name: wishList.name,
          age: wishList.age,
          gender: wishList.gender,
          interests: wishList.interests,
          // TODO: remove any
          maxPrice: (wishList as any).max_price ?? (wishList as any).maxPrice,
          aiSupport: true,
        },
        attemptsRemaining,
      );

    const newRecommendations = recommendations.map((item) => ({
      ...item,
      wishlist_id: id,
    }));

    if (isAttempt) {
      await this.supabase
        .from("wishlists")
        .update({ generate_attempts: wishList.generate_attempts - 1 })
        .eq("id", id);
    }

    const { error: deleteError } = await this.supabase
      .from("recommendations")
      .delete()
      .eq("wishlist_id", id);

    if (deleteError) {
      throw new Error("Error: " + deleteError.message);
    }

    const { error: insertError } = await this.supabase
      .from("recommendations")
      .insert(newRecommendations);

    if (insertError) {
      throw new Error("Error " + insertError.message);
    }

    return {
      success: true,
      recommendations: newRecommendations,
      reusedPrevious: false,
      attemptsRemaining: attemptsRemaining - (isAttempt ? 1 : 0),
    };
  }

  async getWishlistsCount() {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const isoDate = oneYearAgo.toISOString();

    const { data, error } = await this.supabase
      .from("wishlists")
      .select("*")
      .gte("created_at", isoDate);

    if (error) {
      throw new Error("Error: " + error.message);
    }

    return { count: data.length || 0 };
  }
}
