import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import axios from "axios";
import { ConfigService } from "@nestjs/config";
import { WishlistService } from "src/wishlist/wishlist.service";

@Injectable()
export class BolService {
  private BOL_API_URL = "";

  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  // configurable key for the Bol.com API price filter parameter
  private priceParamKey = "12194";

  getProductTitleFromUrl(url: string): string | null {
    try {
      const parsed = new URL(url);
      if (!parsed.hostname.includes("bol.com")) return null;

      const segments = parsed.pathname.split("/").filter(Boolean);
      const titleSegment = segments.reverse().find((s) => !/^\d+$/.test(s));

      return titleSegment?.replace(/-/g, " ") || null;
    } catch {
      return null;
    }
  }

  constructor(
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => WishlistService))
    private readonly wishlistService: WishlistService,
  ) {
    const priceKey = this.configService.get<string>("BOL_PRICE_PARAM");
    if (priceKey) this.priceParamKey = priceKey;
    const apiUrl = this.configService.get<string>("BOL_API_URL");
    if (!apiUrl) {
      throw new InternalServerErrorException(
        "BOL_API_URL is not defined in environment variables",
      );
    }
    this.BOL_API_URL = apiUrl;
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now();

    if (this.accessToken && now < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const clientId = this.configService.get<string>("BOL_CLIENT_ID");
    const clientSecret = this.configService.get<string>("BOL_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      throw new InternalServerErrorException(
        "Missing Bol.com client credentials",
      );
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64",
    );

    try {
      const response = await axios.post(
        "https://login.bol.com/token?grant_type=client_credentials",
        null,
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      const data = response.data as {
        access_token: string;
        expires_in: number;
      };

      if (!data.access_token) {
        throw new InternalServerErrorException("No access token received");
      }

      this.accessToken = data.access_token;
      this.tokenExpiresAt = now + (data.expires_in - 10) * 1000;
      return this.accessToken;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error(
          "Error obtaining access token:",
          error.response?.data || error.message,
        );
      } else {
        console.error("Error obtaining access token:", error);
      }
      throw new InternalServerErrorException(
        "Failed to obtain access token from Bol.com",
      );
    }
  }

  async searchProducts(query: string, maxPrice?: number) {
    const token = await this.getAccessToken();

    try {
      const response = await axios.get(this.BOL_API_URL, {
        params: {
          "search-term": query,
          "country-code": "NL",
          sort: "rating",
          ...(maxPrice !== undefined ? { [this.priceParamKey]: Math.round(maxPrice) } : {}),
          "page-size": 10,
          "include-image": true,
          "include-offer": true,
          "include-rating": true,
        },
        headers: {
          Accept: "application/json",
          "Accept-Language": "nl",
          Authorization: `Bearer ${token}`,
        },
      });

      // console.log(response.data, "bol search");

      type BolProduct = {
        title: string;
        image?: { url: string };
        url: string;
        offer?: { price: number };
        rating?: number;
      };

      type BolApiResponse = {
        results?: BolProduct[];
      };

      const data: BolApiResponse = response.data;

      if (
        !data?.results ||
        !Array.isArray(data.results) ||
        data.results.length === 0
      ) {
        console.warn(`⚠️ No results for query: "${query}"`);
        return [];
      }

        const products = data.results.map((item) => ({
        title: item.title,
        image: item.image?.url ?? "",
        link: item.url,
        price: item.offer?.price ?? 0,
        rating: item.rating,
      }));

      return products;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.warn(`⚠️ Bol.com 404 Not Found for query: "${query}"`);
        return [];
      }

      console.error("❌ Bol.com API error:", error);
      throw new InternalServerErrorException(
        "Failed to fetch products from Bol.com",
      );
    }
  }

  async searchMultipleFromGptInput(gptOutput: string, maxPrice?: number) {
    const queries = gptOutput
      .split(",")
      .map((q) => q.trim().replace(/^"|"$/g, ""))
      .filter((q) => q.length > 0);

    const results: {
      title: string;
      image: string;
      link: string;
      price: number;
      rating: number | undefined;
    }[] = [];

    const seenLinks = new Set<string>();

    for (const query of queries) {
      try {
        const products = await this.searchProducts(query, maxPrice);

        const filtered = products.filter(
          (p) =>
            p.price !== undefined &&
            (maxPrice === undefined || p.price <= maxPrice),
        );

        const candidate = filtered.find((p) => !seenLinks.has(p.link));

        if (candidate) {
          results.push(candidate);
          seenLinks.add(candidate.link);
        }

        if (results.length >= 20) {
          break;
        }
      } catch (err) {
        console.warn(`❌ Bol.com search failed for "${query}"`, err);
      }
    }

    return results;
  }

  async getProductByUrl(url: string) {
    const title = this.getProductTitleFromUrl(url);
    if (!title) throw new BadRequestException("Cannot extract title");

    const results = await this.searchProducts(title);
    if (!results.length)
      throw new NotFoundException("No product found by title");

    return results[0];
  }

  async getProductByUrlAndAddToWishlist(url: string, wishlistId: string) {
    const product = await this.getProductByUrl(url);

    if (!product) {
      throw new NotFoundException("Product not found");
    }

    const result = await this.wishlistService.update(wishlistId, {
      wish_item: {
        id: crypto.randomUUID(),
        title: product.title,
        image: product.image,
        link: product.link,
        price: product.price,
        rating: product.rating,
      },
    });

    return result;
  }

  async getAffiliateLink(productUrl: string) {
    const partnerId = this.configService.get<string>("BOL_PARTNER_ID");

    if (!partnerId) {
      throw new InternalServerErrorException("Missing Bol.com partner ID");
    }

    return `https://partner.bol.com/click/click?p=1&t=url&s=${partnerId}&f=TXL&url=${encodeURIComponent(
      productUrl,
    )}`;
  }
}
