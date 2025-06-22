import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'h45.mijn.host',
      port: 465,
      secure: true,
      auth: {
        user: 'backup@lijstje.ai',
        pass: 'h^JI5jrEb#Ui01Zg',
      },
    });
  }

  async sendEmail(to: string, shareLink: string): Promise<void> {
    const mailOptions = {
      from: 'backup@lijstje.ai',
      to,
      subject: 'Edit verlanglijstje',
      html: `Hallo,<br><br>
Edit jouw verlanglijstje: <a href="${shareLink}">${shareLink}</a><br><br>
Deel deze met niemand anders mits je wilt dat deze persoon het lijstje inhoudelijk mag aanpassen.<br><br>
Heb je niet om deze e-mail gevraagd, dan kun je dit bericht negeren. Lijstje.ai zal nooit contact met je opnemen m.b.t. deze e-mail. Pas op voor phishing scams.<br><br>
Bedankt voor het gebruik van Lijstje.ai!`
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully!');
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }
}
