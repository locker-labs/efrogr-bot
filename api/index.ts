import { VercelRequest, VercelResponse } from '@vercel/node';
import { startVercel } from '../src';
import { cronHandler } from './cronHandler';
const cronUrls = [
  '/api/distribute-daily-jackpot',
  '/api/streaks-payout',
  '/api/transfer-treasury-to-jackpot',
];

export default async function handle(req: VercelRequest, res: VercelResponse) {
  try {
    if (cronUrls.includes(req.url || '')) {
      const secret = process.env.CRON_SECRET || '';
      const authHeader = req.headers['authorization'];
      if (authHeader === `Bearer ${secret}` && req.method === 'GET') {
        await cronHandler(req, res);
        return;
      }
    } else {
      await startVercel(req, res);
    }
  } catch (e: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/html');
    res.end('<h1>Server Error</h1><p>Sorry, there was a problem</p>');
    console.error(e.message);
  }
}
