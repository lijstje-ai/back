import { Inject, Injectable } from '@nestjs/common';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { SupabaseClient } from '@supabase/supabase-js';
import { OpenAiService } from '../openai/openai.service';
import { ProductRecommendation } from './types/recomendations';
import { Wishlist } from './types/wishlist';
import {
  ProductRecommendationUpdatedDto,
  UpdateWishlistDto,
} from './dto/update-wishlist.dto';

@Injectable()
export class WishlistService {
  constructor(
    @Inject('SUPABASE_CLIENT') private readonly supabase: SupabaseClient,
    private readonly openAiService: OpenAiService,
  ) {}

  async create(dto: CreateWishlistDto) {
    let recommendations: ProductRecommendation[] = [];

    if (dto.aiSupport) {
      recommendations =
        await this.openAiService.generateProductRecommendations(dto);
    }

    const { data, error } = await this.supabase
      .from('wishlists')
      .insert([
        {
          name: dto.name,
          age: dto.age,
          gender: dto.gender,
          interests: dto.interests,
          max_price: dto.maxPrice,
          ai_support: dto.aiSupport,
          bought_by: '',
          wish_list: [],
        },
      ])
      .select();

    if (error) throw new Error(error.message);

    const wishlist = data[0] as Wishlist;

    if (recommendations.length > 0) {
      const insertPayload = recommendations.map((rec) => ({
        title: rec.title,
        image: rec.image,
        link: rec.link,
        price: rec.price,
        wishlist_id: wishlist.id,
      }));

      const { error: recError } = await this.supabase
        .from('recommendations')
        .insert(insertPayload);

      if (recError) {
        console.warn('Failed to save recommendations:', recError.message);
      }
    }

    return { id: wishlist.id };
  }

  async findOne(id: string): Promise<{
    wishlist: Wishlist;
    recommendations: ProductRecommendation[];
  }> {
    const response = await this.supabase
      .from('wishlists')
      .select('*')
      .eq('id', id)
      .single();

    if (response.error) throw new Error(response.error.message);

    const wishlist = response.data as Wishlist;

    let recommendations: ProductRecommendation[] = [];

    if (wishlist.ai_support) {
      const recRes = await this.supabase
        .from('recommendations')
        .select('*')
        .eq('wishlist_id', wishlist.id);

      if (recRes.error) {
        console.warn('Failed to load recommendations:', recRes.error.message);
      } else {
        recommendations = recRes.data as ProductRecommendation[];
      }
    }

    return {
      wishlist,
      recommendations,
    };
  }

  async update(id: string, dto: UpdateWishlistDto): Promise<{ success: true }> {
    if (!id) throw new Error('Wishlist ID is required');

    const { data, error: fetchError } = await this.supabase
      .from('wishlists')
      .select('wish_list')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch wishlist: ${fetchError.message}`);
    }

    const currentWishList = Array.isArray(data.wish_list) ? data.wish_list : [];

    const newItem = {
      ...dto.wish_item,
      bought_by: '',
    };

    if (!dto.wish_item.id) {
      newItem.id = crypto.randomUUID();
    }

    const updatedWishList = [...currentWishList, newItem];

    const { error: updateError } = await this.supabase
      .from('wishlists')
      .update({ wish_list: updatedWishList })
      .eq('id', id);

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
      throw new Error('wishlistId, itemId, and buyer are required');
    }

    const { data, error: fetchError } = await this.supabase
      .from('wishlists')
      .select('wish_list')
      .eq('id', wishlistId)
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
      .from('wishlists')
      .update({ wish_list: updatedWishList })
      .eq('id', wishlistId);

    if (updateError) {
      throw new Error(`Failed to update bought_by: ${updateError.message}`);
    }

    return { success: true };
  }

  async remove(id: string): Promise<{ success: true }> {
    const { error: recError } = await this.supabase
      .from('recommendations')
      .delete()
      .eq('wishlist_id', id);

    if (recError) {
      throw new Error(`Failed to delete recommendations: ${recError.message}`);
    }

    const { error: wishlistError } = await this.supabase
      .from('wishlists')
      .delete()
      .eq('id', id);

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
      .from('wishlists')
      .select('wish_list')
      .eq('id', wishlistId)
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
      .from('wishlists')
      .update({ wish_list: updatedWishList })
      .eq('id', wishlistId);

    if (updateError) {
      throw new Error(`Failed to update wishlist: ${updateError.message}`);
    }

    return { success: true };
  }
}
