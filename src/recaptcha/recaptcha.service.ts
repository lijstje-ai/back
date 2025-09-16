import { Injectable, UnauthorizedException } from "@nestjs/common";

@Injectable()
export class RecaptchaService {
  private readonly secret = process.env.RECAPTCHA_SECRET_KEY;

  async validate(token: string) {
    const res = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${this.secret}&response=${token}`,
      { method: "POST" },
    );

    const data = (await res.json()) as { success: boolean; score: number };

    if (!data.success || data.score < 0.5) {
      throw new UnauthorizedException("reCAPTCHA validation failed");
    }
  }
}
