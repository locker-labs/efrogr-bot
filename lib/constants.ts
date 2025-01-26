export const CROAK_ADDRESS =
  process.env.CROAK_ADDRESS || '0xaCb54d07cA167934F57F829BeE2cC665e1A5ebEF';
export const JACKPOT_ADDRESS =
  process.env.JACKPOT_ADDRESS || '0xd7F723f8EDeC8D6D62caa4Ecc2b5Ca1292618355';

export const STREAK_TO_PAYOUT: Record<number, number> = {
  7: 3,
  14: 8,
  30: 20,
  50: 50,
  90: 100,
};

export const StreakDaysDesc = Object.keys(STREAK_TO_PAYOUT)
  .map(Number)
  .sort((a, b) => b - a);
