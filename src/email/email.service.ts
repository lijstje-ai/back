import { ConfigService } from "@nestjs/config";

import { Injectable } from "@nestjs/common";
import { Resend } from "resend";

const configService = new ConfigService();

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(configService.get<string>("RESEND_API_KEY"));
  }

  async sendEmail(to: string, editLink: string): Promise<void> {
    const html = `
      Hallo,<br><br>
      Je persoonlijke verlanglijstje is klaar! Open en bewerk ’m 
      <a href="${editLink}" style="color:#007bff;text-decoration:none;">hier</a>.<br><br>
      <strong>Belangrijk:</strong> Iedereen met deze link kan producten toevoegen en verwijderen. 
      Heb je deze mail niet aangevraagd? Negeer ’m dan gerust.<br><br>
      Bedankt voor het gebruik van Lijstje.ai
    `;

    try {
      await this.resend.emails.send({
        from: "Lijstje.ai <backup@lijstje.ai>",
        to,
        subject: "Verlanglijstje aanpassen",
        html,
        replyTo: "lijstje.ai@gmail.com",
      });
    } catch (error) {
      throw new Error("Failed to send email", error);
    }
  }
}
