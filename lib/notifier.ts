import axios from 'axios';
import TelegramBot from 'node-telegram-bot-api';
import nodemailer from 'nodemailer';

// You would typically load these from environment variables
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '';
const BARK_SERVER = process.env.BARK_SERVER || 'https://api.day.app';
const EMAIL_SERVICE = process.env.EMAIL_SERVICE || 'gmail';
const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASS = process.env.EMAIL_PASS || '';

let bot: TelegramBot | null = null;
if (TELEGRAM_TOKEN) {
  bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });
}

export async function sendTelegram(chatId: string, message: string, userToken?: string | null) {
  // If user provides a token, use it directly via axios to avoid creating bot instances
  if (userToken) {
    try {
      await axios.post(`https://api.telegram.org/bot${userToken}/sendMessage`, {
        chat_id: chatId,
        text: message,
      });
      console.log(`Telegram (User Bot) sent to ${chatId}`);
    } catch (error) {
      console.error('Telegram (User Bot) error:', error);
    }
    return;
  }

  // Fallback to system bot
  if (!bot || !chatId) return;
  try {
    await bot.sendMessage(chatId, message);
    console.log(`Telegram (System Bot) sent to ${chatId}`);
  } catch (error) {
    console.error('Telegram (System Bot) error:', error);
  }
}

export async function sendBark(key: string, title: string, body: string) {
  if (!key) return;
  try {
    // Add ?sound=alarm&level=timeSensitive to ensure continuous/loud ringing
    await axios.get(`${BARK_SERVER}/${key}/${encodeURIComponent(title)}/${encodeURIComponent(body)}?sound=alarm&level=timeSensitive&group=BinanceAlert`);
    console.log(`Bark sent to ${key}`);
  } catch (error) {
    console.error('Bark error:', error);
  }
}

export async function sendEmail(to: string, subject: string, text: string) {
  if (!EMAIL_USER || !EMAIL_PASS || !to) return;
  
  const transporter = nodemailer.createTransport({
    service: EMAIL_SERVICE, // e.g., 'QQ', 'gmail'
    secure: true, // true for 465, false for other ports
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: EMAIL_USER,
      to,
      subject,
      text,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Email error:', error);
  }
}
