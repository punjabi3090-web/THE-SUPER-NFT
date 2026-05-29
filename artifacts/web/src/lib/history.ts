export type HistoryItem = {
  id: number;
  type: 'deposit' | 'withdrawal' | 'reward' | 'commission' | 'security' | 'reserve' | 'sell' | 'trading';
  title?: string;
  amount?: number;
  status?: string;
  txHash?: string;
  date: string;
  icon: string;
  color: string;
  [key: string]: unknown;
};

const TYPE_META: Record<string, { icon: string; color: string }> = {
  deposit:    { icon: '💰', color: '#34A853' },
  withdrawal: { icon: '💸', color: '#EA4335' },
  reward:     { icon: '🎁', color: '#34A853' },
  airdrop:    { icon: '🪂', color: '#9C27B0' },
  referral:   { icon: '👥', color: '#1E3A8A' },
  commission: { icon: '🏆', color: '#9C27B0' },
  security:   { icon: '🔐', color: '#1E3A8A' },
  reserve:    { icon: '🖼️', color: '#FBBC04' },
  sell:       { icon: '💱', color: '#EA4335' },
  trading:    { icon: '📊', color: '#4285F4' },
  levelup:    { icon: '⭐', color: '#FBBC04' },
};

export function addToHistory(type: string, data: Record<string, unknown>) {
  try {
    const raw = localStorage.getItem('myActivityHistory');
    const history: HistoryItem[] = raw ? JSON.parse(raw) : [];
    const meta = TYPE_META[type] ?? { icon: '📋', color: '#666' };
    history.unshift({
      id: Date.now(),
      type: type as HistoryItem['type'],
      date: new Date().toLocaleString('en-US'),
      icon: meta.icon,
      color: meta.color,
      ...data,
    });
    localStorage.setItem('myActivityHistory', JSON.stringify(history.slice(0, 200)));
  } catch { /* silent */ }
}

export function getHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem('myActivityHistory');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export const DEMO_HISTORY: HistoryItem[] = [
  { id: 1,  type: 'deposit',    title: 'Deposit Successful',     amount: 100,   status: 'Completed', txHash: '0x123abc...def', date: '2026-05-27 14:30', icon: '💰', color: '#34A853' },
  { id: 2,  type: 'reward',     title: 'Deposit Bonus Received', amount: 10,    rewardType: 'Deposit Reward', date: '2026-05-27 14:35', icon: '🎁', color: '#34A853' },
  { id: 3,  type: 'withdrawal', title: 'Withdrawal Processed',   amount: 30,    status: 'Completed', txHash: '0xabc123...xyz', date: '2026-05-25 10:15', icon: '💸', color: '#EA4335' },
  { id: 4,  type: 'reward',     title: 'Airdrop Received',       amount: 50,    rewardType: 'Airdrop', date: '2026-05-28 09:00', icon: '🪂', color: '#9C27B0' },
  { id: 5,  type: 'reward',     title: 'Referral Bonus',         amount: 25,    rewardType: 'Referral', date: '2026-05-26 11:20', icon: '👥', color: '#1E3A8A' },
  { id: 6,  type: 'commission', title: 'Team Commission Level 1',amount: 12.50, commissionType: 'Level 1', date: '2026-05-28 08:00', icon: '🏆', color: '#9C27B0' },
  { id: 7,  type: 'security',   title: 'Address Bound',          desc: 'TRC20 withdrawal address saved', date: '2026-05-24 09:00', icon: '🔐', color: '#1E3A8A' },
  { id: 8,  type: 'reserve',    title: 'NFT Reserved',           amount: 100,   nftLevel: 2, date: '2026-05-27 10:00', icon: '🖼️', color: '#FBBC04' },
  { id: 9,  type: 'commission', title: 'Team Commission Level 2',amount: 5.00,  commissionType: 'Level 2', date: '2026-05-29 07:00', icon: '🏆', color: '#9C27B0' },
  { id: 10, type: 'reward',     title: 'Signup Bonus',           amount: 5,     rewardType: 'Signup Bonus', date: '2026-05-24 08:00', icon: '🎉', color: '#34A853' },
];
