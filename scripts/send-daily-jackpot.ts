import * as crypto from 'crypto';
import * as moment from 'moment';
import { ethers } from 'ethers';
import { Telegraf, Markup } from 'telegraf';

import supabase from '../lib/db/supabase';
import { type GameplayEntry } from '../lib/types';
import { CROAK_ADDRESS, JACKPOT_ADDRESS } from '../lib/constants';
import { addCommasToNumber } from '../lib/utils';
// import { mockGameplayEntryData } from '../lib/db/mock-data';

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

const TEXT_LINK = '💵 Play Now 💵';
const EFROGR_URL = 'https://efrogr.locker.money';
const today = moment().utc();
const days = today.clone().day() === 1 ? 2 : 1;
const GIVEAWAY_DATE_START = today.clone().subtract(days, 'days').startOf('day');
const GIVEAWAY_DATE_END = today.clone().subtract(1, 'day').endOf('day');

const getMessage = (
  jackpotAmount: number,
  txHash: string,
  winnerTgUsername: string,
) => `Giveaway ${GIVEAWAY_DATE_START.format('MMM DD, YYYY')} 🎉

🌟 @${winnerTgUsername} 🌟 won ${addCommasToNumber(jackpotAmount)} CROAK
Jealous? Play more. 🎮

===================================
- Proof: https://lineascan.build/tx/${txHash}`;

async function getJackpotEntries() {
  const { data: entries, error } = await supabase
    .from('efrogr_plays_stats')
    .select('*')
    .gte('play_date', GIVEAWAY_DATE_START.toISOString())
    .lt('play_date', GIVEAWAY_DATE_END.toISOString());

  // TESTING
  // const entries = mockGameplayEntryData;
  // const error = null;

  if (error) {
    console.error(
      'Failed to get players from last day\n',
      JSON.stringify(error),
    );
    throw new Error('Failed to get players from last day');
  }

  if (!entries || entries.length === 0) {
    console.log(
      `No entries found for ${GIVEAWAY_DATE_START.format('YYYY-MM-DD')}. Exiting...`,
    );
    process.exit(0);
  }

  return entries as GameplayEntry[];
}

function getRandomWinner(entries: GameplayEntry[]): GameplayEntry {
  const totalPlays = entries.reduce((sum, entry) => sum + entry.num_plays, 0);
  const randomIndex = crypto.randomInt(0, totalPlays);

  let cumulativePlays = 0;
  for (const entry of entries) {
    cumulativePlays += entry.num_plays;
    if (randomIndex < cumulativePlays) {
      return entry; // Winner found
    }
  }

  // If no winner is found (this should never happen)
  throw new Error('Failed to find winner');
}

function getJackpotAmount(entries: GameplayEntry[]): number {
  return entries.reduce((total, entry) => {
    return total + entry.croak_used;
  }, 0);
}

const sendNotifications = async (message: string, entries: GameplayEntry[]) => {
  const bot = new Telegraf(BOT_TOKEN);

  for (const entry of entries) {
    const tg_id = entry.tg_id;
    try {
      console.log('Sending message to ', tg_id);
      await bot.telegram.sendMessage(tg_id, message, {
        parse_mode: 'HTML', // Optional, depends on if your message needs Markdown parsing
        reply_markup: Markup.inlineKeyboard([
          Markup.button.webApp(TEXT_LINK, EFROGR_URL),
        ]).reply_markup,
      });
      // await bot.telegram.sendMessage(id, message);
      // SEND link to miniapp here
    } catch (error) {
      console.error(`Failed to send to user ${tg_id}:`, error);
    }
  }
};

const sendJackpotToWinner = async (winner: GameplayEntry, amount: number) => {
  // TODO: create a db entry to save the jackpot winner?

  const recipientAddress = winner.address;
  const tokenAddress = CROAK_ADDRESS; // ERC20 token contract address
  const amountToSend = ethers.parseUnits(String(amount), 18); // Amount to send in wei

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  const erc20Abi = [
    'function transfer(address to, uint amount) public returns (bool)',
    'function balanceOf(address owner) view returns (uint256)',
  ];

  const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, wallet);

  async function getTokenBalance(walletAddress: string): Promise<number> {
    try {
      const balance = await tokenContract.balanceOf(walletAddress);
      return parseInt(ethers.formatUnits(balance, 18)); // assuming CROAK is used in whole numbers
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw error;
    }
  }

  async function sendTokens() {
    try {
      const tx = await tokenContract.transfer(recipientAddress, amountToSend);
      console.log('Transaction hash:', tx.hash);

      const receipt = await tx.wait();
      console.log('Transaction was mined in block:', receipt.blockNumber);
      return tx.hash;
    } catch (error) {
      console.error('Error sending tokens:', error);
    }
  }

  const balance = await getTokenBalance(wallet.address);
  if (balance < amount) {
    console.error(
      `Insufficient CROAK balance in JACKPOT_ADDRESS ${JACKPOT_ADDRESS} to send tokens`,
    );
    process.exit(1);
  }
  return sendTokens();
};

const distributeJackpot = async () => {
  const entries = await getJackpotEntries();
  const winner = getRandomWinner(entries);
  const amount = getJackpotAmount(entries);
  const txHash = await sendJackpotToWinner(winner, amount);
  const message = getMessage(amount, txHash, winner.tg_username);
  await sendNotifications(message, entries);
};

distributeJackpot()
  .then(() => {
    console.info('Jackpot distributed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to distribute jackpot:', error);
    process.exit(1);
  });
