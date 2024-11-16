import { Telegraf, Markup } from 'telegraf';

import { VercelRequest, VercelResponse } from '@vercel/node';
import { development, production } from './core';
import { generateTelegramHash } from './generateTelegramHash';
import * as jwt from 'jsonwebtoken';

const TEXT_WELCOME =
  'Save CROAK and get the chance to win a free Efrog by getting the froglet to the other side of the pond. 🐸 Brought to you by Locker';
const TEXT_LINK = 'Play now';
const EFROGR_URL = 'https://efrogr.locker.money';

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ENVIRONMENT = process.env.NODE_ENV || '';

if (!BOT_TOKEN) {
  console.error('Please add BOT_TOKEN to the .env file');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
  const userData = {
    authDate: Math.floor(new Date().getTime()),
    firstName: ctx.update.message.from.first_name,
    lastName: '',
    username: ctx.update.message.from.username,
    id: ctx.update.message.from.id,
    photoURL: '',
  };

  // Generate the hash for Telegram authentication
  const hash = generateTelegramHash(userData, BOT_TOKEN);

  // Create JWT with user data and hash
  const telegramAuthToken = jwt.sign(
    {
      ...userData,
      hash,
    },
    BOT_TOKEN, // Use the bot token to sign the JWT
    { algorithm: 'HS256' },
  );
  console.log('[DEBUG] JWT generated for user', userData);

  // URL-encode the generated JWT for safe usage in a URL
  const encodedTelegramAuthToken = encodeURIComponent(telegramAuthToken);

  const url = `${EFROGR_URL}/?telegramAuthToken=${encodedTelegramAuthToken}`;
  console.log('[URL] url generated for user', url);
  ctx.reply(
    TEXT_WELCOME,
    Markup.inlineKeyboard([Markup.button.webApp(TEXT_LINK, url)]),
  );
});

//prod mode (Vercel)
export const startVercel = async (req: VercelRequest, res: VercelResponse) => {
  await production(req, res, bot);
};
//dev mode
ENVIRONMENT !== 'production' && development(bot);
