import { ethers } from 'ethers';
import { CROAK_ADDRESS, JACKPOT_ADDRESS } from '../lib/constants';
import { getCroakPrice } from '../lib/utils';

if (!process.env.PRIVATE_KEY) {
  console.error('Please add PRIVATE_KEY to the .env file');
  process.exit(1);
}
if (!process.env.RPC_URL) {
  console.error('Please add RPC_URL to the .env file');
  process.exit(1);
}

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;
const erc20Abi = [
  'function transfer(address to, uint amount) public returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
];
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const tokenContract = new ethers.Contract(CROAK_ADDRESS, erc20Abi, wallet);

export async function sendCroak(toAddress: string, amount: number) {
  try {
    const balance = parseInt(
      ethers.formatUnits(await tokenContract.balanceOf(JACKPOT_ADDRESS), 18),
    );
    console.log('Jackpot wallet balance:', balance);

    const tokenPrice = await getCroakPrice();
    const tokensToSend = Math.trunc(amount / tokenPrice);

    if (balance >= amount) {
      console.log(`Sending ${tokensToSend} Croak to: ${toAddress}`);

      const tx = await tokenContract.transfer(
        toAddress,
        ethers.parseUnits(String(tokensToSend), 18),
      );
      console.log('Transaction hash:', `https://lineascan.build/tx/${tx.hash}`);

      const receipt = await tx.wait();
      console.log('Transaction was mined in block:', receipt.blockNumber);

      return { txHash: tx.hash };
    } else {
      console.error(
        `Jackpot wallet balance ${balance} is insufficient to send ${tokensToSend} CROAK to ${toAddress}`,
      );
    }
  } catch (error) {
    console.error(`Error in sending $${amount} Croak to ${toAddress}:`, error);
  }
}
