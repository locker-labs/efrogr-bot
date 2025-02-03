import * as crypto from 'crypto';
import moment, { type Moment } from 'moment';
import { ethers } from 'ethers';
import { Telegraf, Markup } from 'telegraf';

import supabase from '../db/supabase';
import { type GameplayEntry } from '../lib/types';
import { CROAK_ADDRESS, JACKPOT_ADDRESS } from '../lib/constants';
import { addCommasToNumber } from '../lib/utils';

if (!process.env.BOT_TOKEN) {
  console.error('Please add BOT_TOKEN to the .env file');
  process.exit(1);
}
if (!process.env.PRIVATE_KEY) {
  console.error('Please add PRIVATE_KEY to the .env file');
  process.exit(1);
}
if (!process.env.RPC_URL) {
  console.error('Please add RPC_URL to the .env file');
  process.exit(1);
}

const BOT_TOKEN = process.env.BOT_TOKEN;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;
const bot = new Telegraf(BOT_TOKEN);

const TEXT_LINK = '💵 Play Now 💵';
const EFROGR_URL = 'https://efrogr.locker.money';

function getMessage(
  GIVEAWAY_DATE_START: Moment,
  jackpotAmount: number,
  txHash: string,
  winnerTgUsername: string,
) {
  return `Giveaway ${GIVEAWAY_DATE_START.format('MMM DD, YYYY')} 🎉

🌟 @${winnerTgUsername} 🌟 won ${addCommasToNumber(jackpotAmount)} CROAK
Jealous? Play more. 🎮

===================================
- Proof: https://lineascan.build/tx/${txHash}`;
}

async function getJackpotEntries(
  GIVEAWAY_DATE_START: Moment,
  GIVEAWAY_DATE_END: Moment,
) {
  const { data: entries, error } = await supabase
    .from('efrogr_plays_stats')
    .select('*')
    .gte('play_date', GIVEAWAY_DATE_START.toISOString())
    .lt('play_date', GIVEAWAY_DATE_END.toISOString());

  console.log('Jackpot Entries:', entries);

  if (error) {
    console.error(
      'Failed to get efrogr_plays_stats from db\n',
      JSON.stringify(error),
    );
    throw new Error('Failed to get efrogr_plays_stats from db', error);
  }

  return entries as GameplayEntry[];
}

function getRandomWinner(
  GIVEAWAY_DATE_START: Moment,
  entries: GameplayEntry[],
): GameplayEntry {
  const totalPlays = entries.reduce((sum, entry) => sum + entry.num_plays, 0);
  const randomIndex = crypto.randomInt(0, totalPlays);

  let cumulativePlays = 0;
  for (const entry of entries) {
    cumulativePlays += entry.num_plays;
    if (randomIndex < cumulativePlays) {
      console.log(
        `${GIVEAWAY_DATE_START.format('YYYY-MM-DD')} Winner:`,
        entry.tg_username,
      );
      return entry; // Winner found
    }
  }

  // If no winner is found (this should never happen)
  throw new Error('Failed to find winner');
}

async function sendNotifications(message: string, entries: GameplayEntry[]) {
  for (const entry of entries) {
    console.log('SENDING NOTIFICATION TO', entry.tg_username);
    const tg_id = entry.tg_id;
    try {
      await bot.telegram.sendMessage(tg_id, message, {
        parse_mode: 'HTML', // Optional, depends on if your message needs Markdown parsing
        reply_markup: Markup.inlineKeyboard([
          Markup.button.webApp(TEXT_LINK, EFROGR_URL),
        ]).reply_markup,
      });
    } catch (error) {
      console.error(`Failed to send message to tg_id ${tg_id}:`, error);
    }
  }
}

async function sendJackpot(recipientAddress: string) {
  // TODO: create a db entry to save the jackpot winner?
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    const erc20Abi = [
      'function transfer(address to, uint amount) public returns (bool)',
      'function balanceOf(address owner) view returns (uint256)',
    ];

    const tokenContract = new ethers.Contract(CROAK_ADDRESS, erc20Abi, wallet);

    const balance = parseInt(
      ethers.formatUnits(await tokenContract.balanceOf(JACKPOT_ADDRESS), 18),
    );
    console.log('Jackpot wallet balance:', balance);

    if (balance === 0) {
      console.error(
        `CROAK balance in JACKPOT_ADDRESS ${JACKPOT_ADDRESS} is ${balance}`,
      );
      throw new Error(
        `CROAK balance in JACKPOT_ADDRESS ${JACKPOT_ADDRESS} is ${balance}`,
      );
    }

    console.log('Sending jackpot to:', recipientAddress);

    const tx = await tokenContract.transfer(
      recipientAddress,
      ethers.parseUnits(String(balance), 18),
    );
    console.log('Transaction hash:', tx.hash);

    const receipt = await tx.wait();
    console.log('Transaction was mined in block:', receipt.blockNumber);

    return { txHash: tx.hash, jackpotAmount: balance };
  } catch (error) {
    console.error(`Error in sending jackpot to ${recipientAddress}:`, error);
    throw new Error(
      `Error in sending jackpot to ${recipientAddress}: ${error}`,
    );
  }
}

export async function distributeJackpot() {
  console.log('DISTRIBUTING JACKPOT');
  const today = moment().utc();
  console.log('Today:', today.toISOString());

  const days = today.clone().day() === 1 ? 2 : 1; // Giveaway duration, 2 days for Monday, 1 day for rest all days
  console.log('Days:', days);

  const GIVEAWAY_DATE_START = today
    .clone()
    .subtract(days, 'days')
    .startOf('day');
  console.log('GIVEAWAY_DATE_START:', GIVEAWAY_DATE_START.toISOString());

  const GIVEAWAY_DATE_END = today.clone().subtract(1, 'day').endOf('day');
  console.log('GIVEAWAY_DATE_END:', GIVEAWAY_DATE_END.toISOString());

  if (today.clone().day() === 0) {
    console.log('Not to be run on Sunday');
    return { message: 'Not to be run on Sunday' };
  }

  const entries = await getJackpotEntries(
    GIVEAWAY_DATE_START,
    GIVEAWAY_DATE_END,
  );
  if (entries.length === 0) {
    console.log('No entries found');
    return {
      message: `No gameplay entries found for ${GIVEAWAY_DATE_START.format('YYYY-MM-DD')}.`,
    };
  }

  const winner = getRandomWinner(GIVEAWAY_DATE_START, entries);
  const { txHash, jackpotAmount } = await sendJackpot(winner.address);
  const message = getMessage(
    GIVEAWAY_DATE_START,
    jackpotAmount,
    txHash,
    winner.tg_username,
  );
  await sendNotifications(message, entries);

  return {
    message: 'Jackpot distributed.',
    winner_tg: winner.tg_username,
    amount: jackpotAmount,
    tx_hash: txHash,
  };
}

// distributeJackpot();
