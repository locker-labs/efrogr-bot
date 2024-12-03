import { Telegraf } from 'telegraf';

const BOT_TOKEN = process.env.BOT_TOKEN || '';

const recipients: any = [];

// Marvin
// const recipients = [1308478915];
const bot = new Telegraf(BOT_TOKEN);

const message = `🎮 Efrogr jackpot for Dec 2, 2024. Today's winner has been selected. 🎮

1,998.5 CROAK Jackpot 💰
Congratulations @USERNAME, you are on a lucky streak! 🎉

Thank you for playing during this test phase. Stay tuned for an official launch announcement from Efrogs soon. 🚀

https://lineascan.build/tx/0x233aa1add51e3a6c0cd05f50fbfa8cd5ffd7dfe9c2f31b57b7d2551a098fd6fc`;

const sendNotifications = async () => {
  for (const recipient of recipients) {
    const id = recipient.tgid;
    try {
      console.log('Sending message to ', id);
      await bot.telegram.sendMessage(id, message);
    } catch (error) {
      console.error(`Failed to send to user ${id}:`, error);
    }
  }
};

sendNotifications();
