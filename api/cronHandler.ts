import { VercelRequest, VercelResponse } from '@vercel/node';
import { distributeJackpot } from '../scripts/send-daily-jackpot';
import { sendStreakPayouts } from '../scripts/send-streaks-payout';
import { transferTreasuryToJackpot } from '../scripts/transfer-treasury-to-jackpot';

export async function cronHandler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.url === '/api/distribute-daily-jackpot') {
      const distributeJackpotMsg = await distributeJackpot();
      const treasuryTransferMsg = await transferTreasuryToJackpot();
      const messageJson = { distributeJackpotMsg, treasuryTransferMsg };
      return res
        .status(200)
        .setHeader('Content-Type', 'application/json')
        .json(messageJson);
    } else if (req.url === '/api/streaks-payout') {
      const messageJson = await sendStreakPayouts();
      return res
        .status(200)
        .setHeader('Content-Type', 'application/json')
        .json({ messageJson });
    }
  } catch (e: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/html');
    res.end('<h1>Server Error</h1><p>Sorry, there was a problem</p>');
    console.error(e.message);
  }
}
