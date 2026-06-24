import { createClient } from '@supabase/supabase-js';
import { authenticator } from 'otplib';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' });

  const { secret, token: totpToken } = req.body;
  if (!secret || !totpToken) return res.status(400).json({ error: 'Missing data' });

  const isValid = authenticator.check(totpToken, secret);
  if (!isValid) return res.status(400).json({ error: 'Invalid code' });

  // IHTIYAT: Sirf profiles table update ho rahi hai
  const { error: updateErr } = await supabaseAdmin
    .from('profiles')
    .update({ totp_enabled: true, totp_secret: secret })
    .eq('id', user.id);
    
  if (updateErr) return res.status(500).json({ error: 'DB update failed' });
  
  return res.status(200).json({ ok: true });
}