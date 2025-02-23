import { linea, sepolia } from 'viem/chains';

// TODO: change this to the correct chain
export const CHAIN = linea;
// set CHAIN based on vercel env

export const BUNDLER_URL = process.env.BUNDLER_URL;
console.log('BUNDLER_URL', BUNDLER_URL);
if (!BUNDLER_URL) throw new Error('BUNDLER_URL is not set');

export const PAYMASTER_URL = process.env.PAYMASTER_URL;
console.log('PAYMASTER_URL', PAYMASTER_URL);
if (!PAYMASTER_URL) throw new Error('PAYMASTER_URL is not set');

export const RPC_URL = process.env.RPC_URL;
console.log('RPC_URL', RPC_URL);
if (!RPC_URL) throw new Error('RPC_URL is not set');

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

export const DAY_TO_WITHDRAW_AMOUNT: Record<number, number> = {
  1: 10, // Monday
  2: 10, // Tuesday
  3: 10, // Wednesday
  4: 10, // Thursday
  5: 10, // Friday
  6: 30, // Saturday
};

export const MAX_TO_WITHDRAW_AMOUNT: Record<number, number> = {
  1: 10000, // Monday
  2: 10000, // Tuesday
  3: 10000, // Wednesday
  4: 10000, // Thursday
  5: 10000, // Friday
  6: 30000, // Saturday
};

export const StreakDaysDesc = Object.keys(STREAK_TO_PAYOUT)
  .map(Number)
  .sort((a, b) => b - a);

export const CroakGroupId = process.env.CROAK_GROUP_ID!;
console.log('CROAK_GROUP_ID', CroakGroupId);
if (!CroakGroupId) throw new Error('CROAK_GROUP_ID is not set');
