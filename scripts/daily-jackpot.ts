import { Telegraf, Markup } from 'telegraf';

const BOT_TOKEN = process.env.BOT_TOKEN || '';

const recipients: any = [];

// Marvin
// const recipients = [{ tgid: 1308478915 }];
const bot = new Telegraf(BOT_TOKEN);
const TEXT_LINK = '💵 Play Now 💵';
const EFROGR_URL = 'https://efrogr.locker.money';

// 🚀 STREAKS REMINDER 🚀
// 🗓️ Play Efrogr 7 days in a row and you get GUARANTEED CROAK.
// ⏫ Keep playing longer, and more guaranteed payout.

// const message = `🆓 FREE CROAK 🆓
const message = `Giveaway Dec 17, 2024

🌟 @XXX 🌟 won 7,698 CROAK
Jealous? Play more. 🎮

===================================
- Proof: https://lineascan.build/tx/0x46535f9a859de72afcf4d80d2ffcad6caaa3d9376267d1821bde0f839c404cfc`;

const sendNotifications = async () => {
  for (const recipient of recipients) {
    const id = recipient.tgid;
    try {
      console.log('Sending message to ', id);
      await bot.telegram.sendMessage(id, message, {
        parse_mode: 'HTML', // Optional, depends on if your message needs Markdown parsing
        reply_markup: Markup.inlineKeyboard([
          Markup.button.webApp(TEXT_LINK, EFROGR_URL),
        ]).reply_markup,
      });
      // await bot.telegram.sendMessage(id, message);
      // SEND link to miniapp here
    } catch (error) {
      console.error(`Failed to send to user ${id}:`, error);
    }
  }
};

sendNotifications();
