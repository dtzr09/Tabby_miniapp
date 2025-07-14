import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { validateTelegramWebApp } from '../../../lib/validateTelegram';

const BOT_TOKEN = process.env.NODE_ENV === 'development'
  ? process.env.TELEGRAM_DEV_BOT_TOKEN!
  : process.env.TELEGRAM_BOT_TOKEN!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { telegram_id, initData } = req.query;

    // Validate Telegram WebApp data
    if (!validateTelegramWebApp(initData as string, BOT_TOKEN)) {
      return res.status(401).json({ error: 'Invalid Telegram WebApp data' });
    }

    // Get the user row by telegram_id
    const { data: users, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('telegram_id', telegram_id as string)
      .limit(1);

    if (userError || !users || users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userId = users[0].id;

    // Get expenses for this user, join with categories
    const { data, error } = await supabaseAdmin
      .from('expenses')
      .select('id, amount, description, date, category:category_id (name, emoji)')
      .eq('payer_id', userId);

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json(data);
  }

  res.setHeader('Allow', ['GET']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
} 