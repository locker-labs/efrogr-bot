import { ethers } from 'ethers';
import { type Address } from 'viem';
import moment from 'moment';
import {
  CROAK_ADDRESS,
  JACKPOT_ADDRESS,
  DAY_TO_WITHDRAW_AMOUNT,
  MAX_TO_WITHDRAW_AMOUNT,
} from '../lib/constants';
import { amountToCroak } from '../lib/utils';
import sendUserOp from '../lib/zerodev/sendUserOp';

const withdrawAsOwner = async (amount: bigint) => {
  const payouts: Record<Address, bigint> = {};
  payouts[JACKPOT_ADDRESS as Address] = amount;
  return await sendUserOp(CROAK_ADDRESS as Address, payouts);
};

export const transferTreasuryToJackpot = async () => {
  const day = moment().utc().day();
  console.log('day', day);

  const withdrawAmount = DAY_TO_WITHDRAW_AMOUNT[day];
  console.log('withdrawAmount', withdrawAmount);

  if (!withdrawAmount) {
    const message = 'Not to be run on Sunday';
    console.log(message);
    return { message };
  }

  const maxWithdrawAmount = MAX_TO_WITHDRAW_AMOUNT[day];
  console.log('maxWithdrawAmount', maxWithdrawAmount);

  if (!maxWithdrawAmount) {
    const message = 'Not to be run on Sunday';
    console.log(message);
    return { message };
  }

  const croakAmount = await amountToCroak(withdrawAmount);
  const cappedCroakAmount = Math.min(croakAmount, maxWithdrawAmount);
  console.log('cappedCroakAmount', cappedCroakAmount);
  const croakAmountBigInt = BigInt(
    ethers.parseUnits(String(cappedCroakAmount), 18),
  );
  console.log('croakAmountBigInt', croakAmountBigInt);
  const userOpHash = await withdrawAsOwner(croakAmountBigInt);

  return { message: 'Treasury to Jackpot transfer initiated', userOpHash };
};

// transferTreasuryToJackpot()
