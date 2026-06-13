import express from 'express';
import { supabase } from '../utils/supabase';

const router = express.Router();

async function distributeTeamCommission(userId: string, earnedAmount: number) {
  try {
    const { data: userData } = await supabase
      .from('users')
      .select('referred_by, enthusiast_type')
      .eq('id', userId)
      .single();

    if (!userData || !userData.referred_by) return;

    const { data: uplineData } = await supabase
      .from('users')
      .select('level, team_earnings')
      .eq('id', userData.referred_by)
      .single();

    if (!uplineData || uplineData.level < 2) return;

    let commissionPercent = 0;
    if (userData.enthusiast_type === 'Diamond') commissionPercent = 8;
    else if (userData.enthusiast_type === 'Gold') commissionPercent = 5;
    else if (userData.enthusiast_type === 'Silver') commissionPercent = 3;

    if (commissionPercent === 0) return;

    const commission = (earnedAmount * commissionPercent) / 100;
    const newTeamEarnings = (uplineData.team_earnings || 0) + commission;

    await supabase
      .from('users')
      .update({ team_earnings: newTeamEarnings })
      .eq('id', userData.referred_by);

  } catch (error) {
    console.error('Team commission error:', error);
  }
}

router.post('/distribute', async (req, res) => {
  const { userId, earnedAmount } = req.body;
  
  if (!userId || !earnedAmount) {
    res.status(400).json({ error: 'Missing userId or earnedAmount' });
    return;
  }

  try {
    await distributeTeamCommission(userId, earnedAmount);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Commission failed' });
  }
});

export default router;