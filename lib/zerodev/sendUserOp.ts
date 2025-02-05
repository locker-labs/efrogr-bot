import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import {
  createKernelAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
  getUserOperationGasPrice,
} from '@zerodev/sdk';
import { getEntryPoint, KERNEL_V3_1 } from '@zerodev/sdk/constants';
import { privateKeyToAccount } from 'viem/accounts';
import {
  type Address,
  createPublicClient,
  encodeFunctionData,
  erc20Abi,
  Hex,
  http,
  type PublicClient,
  zeroAddress,
} from 'viem';
import { CHAIN, BUNDLER_URL, PAYMASTER_URL, RPC_URL } from '../constants';

const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
  throw new Error('PRIVATE_KEY is not set');
}

const entryPoint = getEntryPoint('0.7');
const kernelVersion = KERNEL_V3_1;

const publicClient = createPublicClient({
  transport: http(RPC_URL),
  chain: CHAIN,
});

const signer = privateKeyToAccount(`0x${PRIVATE_KEY}`);

// ************************************************************* //

// ************************************************************* //
// Constructs and submits userOp to send token out of SCA
// ************************************************************* //
const sendUserOp = async (
  token: Address,
  payouts: Record<Address, bigint>,
): Promise<Address | undefined> => {
  const ecdsaValidator = await signerToEcdsaValidator(
    publicClient as PublicClient,
    {
      signer,
      entryPoint,
      kernelVersion,
    },
  );

  const index = BigInt(0);

  const kernelAccountObj = await createKernelAccount(
    publicClient as PublicClient,
    {
      kernelVersion,
      index,
      entryPoint,
      plugins: {
        sudo: ecdsaValidator,
      },
    },
  );

  const zerodevPaymaster = createZeroDevPaymasterClient({
    chain: CHAIN,
    transport: http(PAYMASTER_URL),
  });

  const kernelAccountClient = createKernelAccountClient({
    account: kernelAccountObj,
    chain: CHAIN,
    bundlerTransport: http(BUNDLER_URL),
    client: publicClient,
    paymaster: {
      getPaymasterData(userOperation) {
        return zerodevPaymaster.sponsorUserOperation({ userOperation });
      },
    },
    userOperation: {
      estimateFeesPerGas: async ({ bundlerClient }) =>
        getUserOperationGasPrice(bundlerClient),
    },
  });

  const accountAddress = kernelAccountClient.account.address;
  console.log('SCA:', accountAddress);

  let hash;

  try {
    if (
      token === zeroAddress ||
      token === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
    ) {
      // Native token
      const calls = Object.entries(payouts).map(
        ([recipient, amount]) =>
          ({
            to: recipient,
            value: amount,
            data: '0x00000000', // default to 0x
          }) as {
            to: Address;
            value: bigint;
            data: Hex;
          },
      );

      hash = await kernelAccountClient.sendTransaction({ calls });
    } else {
      // ERC-20 token
      const calls = Object.entries(payouts).map(([recipient, amount]) => ({
        to: token,
        value: BigInt(0),
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: 'transfer',
          args: [recipient as Address, amount],
        }),
      }));

      hash = await kernelAccountClient.sendUserOperation({
        callData: await kernelAccountObj.encodeCalls(calls),
      });
    }

    console.log('userOpHash', hash);
    return hash;
  } catch (error) {
    const acceptableErrorMessages = ['rejected', 'request reset', 'denied'];
    if (
      !acceptableErrorMessages.some((msg) =>
        (error as Error).message.includes(msg),
      )
    ) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }

  return hash;
};

export default sendUserOp;
