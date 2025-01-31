import moment from 'moment';
import { getEfrogrPlaysStats } from '../db/queries';
import { sendCroak } from '../transactions/sendCroak';
import { type GameplayEntry } from '../lib/types';
import { StreakDaysDesc, STREAK_TO_PAYOUT } from '../lib/constants';

const today = moment().utc();
const days = today.clone().day() === 1 ? 2 : 1; // Giveaway duration, 2 days for Monday, 1 day for rest all days
const GIVEAWAY_DATE_START = today.clone().subtract(days, 'days').startOf('day');

export async function sendStreakPayouts() {
  const stats: GameplayEntry[] = await getEfrogrPlaysStats();
  const day = GIVEAWAY_DATE_START;

  const streakCount: Record<string, number> = {};
  const addressToPayout: Record<string, number> = {};

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
      addressToPayout[address] = STREAK_TO_PAYOUT[streak];
    }
  }

  console.log('addressToPayout', addressToPayout);

  // send payouts
  for (const [address, payout] of Object.entries(addressToPayout)) {
    // await sendCroak(address, payout);
  }

  return { addressToPayout, streakCount };
}

// sendStreakPayouts()