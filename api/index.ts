import { VercelRequest, VercelResponse } from '@vercel/node';
import { startVercel } from '../src';
import { distributeJackpot } from '../scripts/send-daily-jackpot';

export default async function handle(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET' && req.url === '/api/distribute-daily-jackpot') {
      const secret = process.env.CRON_SECRET || '';
      const authHeader = req.headers['authorization'];

      if (authHeader !== `Bearer ${secret}`) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'text/html');
        res.end('<h1>Unauthorized</h1><p>Sorry, you are not authorized</p>');
        return;
      }

      const messageJson = await distributeJackpot();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(messageJson);
      return;
    }
    await startVercel(req, res);
  } catch (e: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/html');
    res.end('<h1>Server Error</h1><p>Sorry, there was a problem</p>');
    console.error(e.message);
  }
}
