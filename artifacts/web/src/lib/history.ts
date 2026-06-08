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

/** No-op — activity history is now stored in the Supabase `transactions` table. */
export function addToHistory(_type: string, _data: Record<string, unknown>) {
  /* no-op */
}

/** Returns empty — activity history is now fetched from Supabase `transactions` table. */
export function getHistory(): HistoryItem[] {
  return [];
}

export const DEMO_HISTORY: HistoryItem[] = [];
