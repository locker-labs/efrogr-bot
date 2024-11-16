import { Telegraf, Markup } from 'telegraf';

import { about } from './commands';
import { greeting } from './text';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { development, production } from './core';

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ENVIRONMENT = process.env.NODE_ENV || '';

const bot = new Telegraf(BOT_TOKEN);
const welcomeText =
  'Save CROAK and get the chance to win a free Efrog by getting the froglet to the other side of the pond. 🐸 Brought to you by Locker';
const linkText = 'Play now';
const url = 'https://efrogr.locker.money';

bot.start((ctx) =>
  ctx.reply(
    welcomeText,
    Markup.inlineKeyboard([Markup.button.webApp(linkText, url)]),
  ),
);

//prod mode (Vercel)
export const startVercel = async (req: VercelRequest, res: VercelResponse) => {
  await production(req, res, bot);
};
//dev mode
ENVIRONMENT !== 'production' && development(bot);
