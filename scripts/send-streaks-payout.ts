import moment from 'moment';
import { ethers } from 'ethers';
import { type Address } from 'viem';
import { getEfrogrPlaysStats } from '../db/queries';
import { type GameplayEntry } from '../lib/types';
import { CROAK_ADDRESS, STREAK_TO_PAYOUT } from '../lib/constants';
import { getCroakPrice } from '../lib/utils';
import sendUserOp from '../lib/zerodev/sendUserOp';

export async function sendStreakPayouts() {
  const today = moment().utc();
  const days = today.clone().day() === 1 ? 2 : 1; // Giveaway duration, 2 days for Monday, 1 day for rest all days
  const GIVEAWAY_DATE_START = today
    .clone()
    .subtract(days, 'days')
    .startOf('day');

  const stats: GameplayEntry[] = await getEfrogrPlaysStats();
  const day = GIVEAWAY_DATE_START;

  const streakCount: Record<Address, number> = {};
  const addressToPayout: Record<Address, number> = {};
  const addressToPayoutBigInt: Record<Address, bigint> = {};

  let expectedStreak = 0;
  let entriesOnDay;

  do {
    entriesOnDay = stats.filter((entry) =>
      moment(entry.play_date).isSame(day, 'day'),
    );

    for (const entry of entriesOnDay) {
      const userStreak = streakCount[entry.address] ?? 0;
      if (userStreak < expectedStreak) {
        // Streak ended for user
      } else {
        streakCount[entry.address] = 1 + userStreak;
      }
    }

    ++expectedStreak;
    day.subtract(1, 'day');
  } while (entriesOnDay.length > 0);

  console.log('streakCount', streakCount);

  // now we have the streak count for each user
  for (const [address, streak] of Object.entries(streakCount)) {
    if (STREAK_TO_PAYOUT[streak]) {
      addressToPayout[address as Address] = STREAK_TO_PAYOUT[streak];
    }
  }

  console.log('addressToPayout', addressToPayout);

  if (Object.entries(addressToPayout).length === 0) {
    console.log('No streak payouts to send');
    return { addressToPayout, streakCount };
  }

  const tokenPrice = await getCroakPrice();

  for (const [address, payout] of Object.entries(addressToPayout)) {
    const tokensToSend = Math.trunc(payout / tokenPrice);
    const tokensBigInt = ethers.parseUnits(String(tokensToSend), 18);
    addressToPayoutBigInt[address as Address] = tokensBigInt;
  }

  console.log('addressToPayoutBigInt', addressToPayoutBigInt);

  const userOpHash = await sendUserOp(
    CROAK_ADDRESS as Address,
    addressToPayoutBigInt,
  );

  return { addressToPayout, streakCount, userOpHash };
}

// sendStreakPayouts()
