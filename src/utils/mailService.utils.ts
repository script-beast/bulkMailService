import nodemailer from "nodemailer";

class NodeMailerService {
  private transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    secure: true,
    auth: {
      user: process.env.MAIL_EMAIL,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  public async sendMail(to: string, subject: string, html: string) {
    const mailOptions = {
      from: {
        name: String(process.env.MAIL_USER),
        address: String(process.env.MAIL_EMAIL),
      },
      to,
      subject,
      html,
    };

    return this.transporter.sendMail(mailOptions);
  }
}

export default NodeMailerService;
