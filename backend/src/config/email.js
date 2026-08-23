import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendEmail = async (to, subject, text, retries = 3) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[Mock Email] To: ${to} | Subject: ${subject}`);
    return;
  }
  
  let attempt = 0;
  while (attempt < retries) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        text
      });
      console.log(`Email sent to ${to}`);
      return; // Success, exit loop
    } catch (error) {
      attempt++;
      console.error(`Email sending failed (Attempt ${attempt}/${retries}):`, error);
      if (attempt >= retries) {
        console.error(`Final failure sending email to ${to}`);
      } else {
        // Wait 2 seconds before retrying
        await new Promise(res => setTimeout(res, 2000));
      }
    }
  }
};
