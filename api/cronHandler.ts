import { VercelRequest, VercelResponse } from '@vercel/node';
import { distributeJackpot } from '../scripts/send-daily-jackpot';
import { sendStreakPayouts } from '../scripts/send-streaks-payout';

export async function cronHandler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.url === '/api/distribute-daily-jackpot') {
      const messageJson = await distributeJackpot();
      return res
        .status(200)
        .setHeader('Content-Type', 'application/json')
        .json(messageJson);
    } else if (req.url === '/api/streaks-payout') {
      const messageJson = await sendStreakPayouts();
      return res
        .status(200)
        .setHeader('Content-Type', 'application/json')
        .json(messageJson);
    }
  } catch (e: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/html');
    res.end('<h1>Server Error</h1><p>Sorry, there was a problem</p>');
    console.error(e.message);
  }
}
