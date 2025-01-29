import { ethers } from 'ethers';
import moment from 'moment';
import {
  CROAK_ADDRESS,
  JACKPOT_ADDRESS,
  DAY_TO_WITHDRAW_AMOUNT,
} from '../lib/constants';
import { amountToCroak } from '../lib/utils';
import sendUserOp from '../lib/zerodev/sendUserOp';

const withdrawAsOwner = async (amount: bigint) => {
  return await sendUserOp(
    JACKPOT_ADDRESS as `0x${string}`,
    CROAK_ADDRESS as `0x${string}`,
    amount,
  );
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

  const croakAmount = await amountToCroak(withdrawAmount);
  const croakAmountBigInt = BigInt(ethers.parseUnits(String(croakAmount), 18));
  const userOpHash = await withdrawAsOwner(croakAmountBigInt);

  return { message: 'Treasury to Jackpot transfer initiated', userOpHash };
};
