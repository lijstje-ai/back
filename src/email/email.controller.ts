import { Controller, Post, Body } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  async sendEditLink(
    @Body('to') to: string,
    @Body('shareLink') shareLink: string,
  ) {
    await this.emailService.sendEmail(to, shareLink);
    return { message: 'Email sent successfully!' };
  }
}
