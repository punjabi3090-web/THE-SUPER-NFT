// Complete data layer — pure localStorage, zero hardcoded data

export type HistoryItem = {
  id: number;
  type: 'deposit' | 'withdrawal' | 'reward' | 'commission' | 'security' | 'reserve' | 'sell' | 'trading' | 'admin';
  title?: string;
  amount?: number;
  status?: string;
  txHash?: string;
  date: string;
  icon: string;
  color: string;
  rewardType?: string;
  commissionType?: string;
  nftLevel?: number;
  desc?: string;
  from?: string;
};

export type User = {
  userId: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  country: string;
  referralCode: string;
  referredBy: string | null;
  walletBalance: number;
  nftAccountBalance: number;
  totalDeposit: number;
  totalWithdraw: number;
  level: number;
  isBlocked: boolean;
  googleAuthBound: boolean;
  googleAuthSecret: string | null;
  withdrawalAddress: string | null;
  addressBindDate: string | null;
  joinDate: string;
  lastLogin: string;
  myActivityHistory: HistoryItem[];
};

export type WithdrawalRequest = {
  id: number;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  address: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  approvedDate?: string;
  rejectedDate?: string;
  approvedBy?: string;
  rejectReason?: string;
  txHash?: string;
};

export type AdminNotif = {
  id: number;
  title: string;
  message: string;
  type: string;
  date: string;
  read: string[];
};

export type AdminLog = {
  id: number;
  admin: string;
  action: string;
  target: string;
  amount: number;
  details: string;
  timestamp: string;
};

export type RewardSettings = {
  depositBonus: { enabled: boolean; percentage: number; minDeposit: number; maxBonus: number };
  referralBonus: { enabled: boolean; level1: number; level2: number; level3: number };
  activityReward: { enabled: boolean; dailyLogin: number; reserveNFT: number; completeProfile: number };
  reservationSettings: { enabled: boolean; minAmount: number; maxAmount: number; profitPercentage: number; lockPeriodDays: number };
  levelSystem: { level2Deposit: number; level2Bonus: number; level3Deposit: number; level3Bonus: number; level4Deposit: number; level4Bonus: number };
};

export type WithdrawalSettings = {
  enabled: boolean;
  startTime: string;
  endTime: string;
  minAmount: number;
  maxAmount: number;
  requireGoogleAuth: boolean;
  requireAddressBind: boolean;
  bindDelayHours: number;
};

export type WithdrawResult = 'ok' | 'insufficient' | 'min' | 'max' | 'no_auth' | 'no_address' | 'time_restricted' | 'delay' | 'disabled';

// ── Helpers ────────────────────────────────────────────────────────────────

function ls<T>(key: string, fb: T): T {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fb; } catch { return fb; }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ── App Initialization ─────────────────────────────────────────────────────

export function initializeApp() {
  if (localStorage.getItem('appInitialized')) return;
  lsSet('allUsers', []);
  localStorage.setItem('adminWallet', '0');
  lsSet('withdrawalRequests', []);
  lsSet('adminNotifications', []);
  lsSet('adminLogs', []);
  lsSet('systemSettings', { siteName: 'THE SUPER NFT', maintenanceMode: false });
  lsSet('rewardSettings', {
    depositBonus: { enabled: true, percentage: 10, minDeposit: 50, maxBonus: 500 },
    referralBonus: { enabled: true, level1: 5, level2: 3, level3: 1 },
    activityReward: { enabled: true, dailyLogin: 1, reserveNFT: 2, completeProfile: 5 },
    reservationSettings: { enabled: true, minAmount: 10, maxAmount: 500, profitPercentage: 15, lockPeriodDays: 7 },
    levelSystem: { level2Deposit: 100, level2Bonus: 20, level3Deposit: 500, level3Bonus: 50, level4Deposit: 1000, level4Bonus: 100 },
  } as RewardSettings);
  lsSet('withdrawalSettings', {
    enabled: true, startTime: '00:00', endTime: '23:59',
    minAmount: 10, maxAmount: 1000, requireGoogleAuth: false,
    requireAddressBind: false, bindDelayHours: 0,
  } as WithdrawalSettings);
  lsSet('securitySettings', { forceGoogleAuth: false, forceAddressBind: false, withdrawalDelayHours: 0 });
  localStorage.setItem('appInitialized', 'true');
}

// ── User CRUD ──────────────────────────────────────────────────────────────

export function getAllUsers(): User[] { return ls<User[]>('allUsers', []); }

export function getCurrentUserId(): string | null { return localStorage.getItem('currentUser'); }

export function getCurrentUser(): User | null {
  const uid = getCurrentUserId();
  if (!uid) return null;
  return getAllUsers().find(u => u.userId === uid) ?? null;
}

export function updateUser(userId: string, updates: Partial<User>) {
  const users = getAllUsers();
  const i = users.findIndex(u => u.userId === userId);
  if (i === -1) return;
  users[i] = { ...users[i], ...updates };
  lsSet('allUsers', users);
}

export function addToUserHistory(userId: string, item: Omit<HistoryItem, 'id'>) {
  const users = getAllUsers();
  const i = users.findIndex(u => u.userId === userId);
  if (i === -1) return;
  users[i].myActivityHistory = [{ id: Date.now(), ...item }, ...(users[i].myActivityHistory || [])];
  lsSet('allUsers', users);
}

// ── Auth ───────────────────────────────────────────────────────────────────

export function registerUser(data: {
  name: string; email: string; phone: string; password: string; country: string; referralCode?: string;
}): User | 'email_exists' {
  const users = getAllUsers();
  if (users.find(u => u.email.toLowerCase() === data.email.toLowerCase())) return 'email_exists';

  const refCode = data.name.substring(0, 4).toUpperCase() + Math.floor(1000 + Math.random() * 9000);
  const newUser: User = {
    userId: 'USR_' + Date.now(),
    name: data.name, email: data.email, phone: data.phone,
    password: data.password, country: data.country,
    referralCode: refCode, referredBy: data.referralCode?.trim() || null,
    walletBalance: 0, nftAccountBalance: 0, totalDeposit: 0, totalWithdraw: 0,
    level: 1, isBlocked: false, googleAuthBound: false, googleAuthSecret: null,
    withdrawalAddress: null, addressBindDate: null,
    joinDate: new Date().toISOString(), lastLogin: new Date().toISOString(),
    myActivityHistory: [],
  };
  users.push(newUser);

  if (newUser.referredBy) {
    const ui = users.findIndex(u => u.referralCode === newUser.referredBy);
    if (ui !== -1) {
      users[ui].myActivityHistory.unshift({
        id: Date.now() + 1, type: 'commission', title: 'New Referral Joined',
        desc: `${newUser.name} joined via your referral`, date: new Date().toLocaleString(),
        icon: '👥', color: '#9C27B0',
      });
    }
  }
  lsSet('allUsers', users);
  return newUser;
}

export function loginUser(email: string, password: string): User | 'blocked' | 'invalid' {
  const user = getAllUsers().find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) return 'invalid';
  if (user.isBlocked) return 'blocked';
  updateUser(user.userId, { lastLogin: new Date().toISOString() });
  return { ...user, lastLogin: new Date().toISOString() };
}

export function setCurrentUser(userId: string) { localStorage.setItem('currentUser', userId); }
export function logoutUser() { localStorage.removeItem('currentUser'); }

// ── Deposit ────────────────────────────────────────────────────────────────

export function processDeposit(userId: string, amount: number, network: string) {
  const users = getAllUsers();
  const i = users.findIndex(u => u.userId === userId);
  if (i === -1) return;

  users[i].walletBalance    += amount;
  users[i].nftAccountBalance += amount;
  users[i].totalDeposit     += amount;

  const aw = parseFloat(localStorage.getItem('adminWallet') || '0');
  localStorage.setItem('adminWallet', (aw + amount).toString());

  users[i].myActivityHistory.unshift({
    id: Date.now(), type: 'deposit', title: 'Deposit Successful',
    amount, status: 'Completed', txHash: '0x' + Date.now().toString(16),
    date: new Date().toLocaleString(), icon: '💰', color: '#34A853', desc: `Via ${network}`,
  });
  lsSet('allUsers', users);
  checkAutoRewards(userId, amount);
}

// ── Withdrawal ─────────────────────────────────────────────────────────────

export function submitWithdrawalRequest(userId: string, amount: number): WithdrawResult {
  const settings = getWithdrawalSettings();
  if (!settings.enabled) return 'disabled';
  const user = getAllUsers().find(u => u.userId === userId);
  if (!user) return 'insufficient';
  if (settings.requireGoogleAuth && !user.googleAuthBound) return 'no_auth';
  if (settings.requireAddressBind && !user.withdrawalAddress)  return 'no_address';
  if (user.addressBindDate && settings.bindDelayHours > 0) {
    const hrs = (Date.now() - new Date(user.addressBindDate).getTime()) / 3_600_000;
    if (hrs < settings.bindDelayHours) return 'delay';
  }
  const [sh, sm] = settings.startTime.split(':').map(Number);
  const [eh, em] = settings.endTime.split(':').map(Number);
  const now = new Date().getHours() * 60 + new Date().getMinutes();
  if (now < sh * 60 + sm || now > eh * 60 + em) return 'time_restricted';
  if (amount < settings.minAmount) return 'min';
  if (amount > settings.maxAmount) return 'max';
  if (amount > user.walletBalance) return 'insufficient';

  updateUser(userId, { walletBalance: user.walletBalance - amount });
  const reqs = ls<WithdrawalRequest[]>('withdrawalRequests', []);
  reqs.unshift({
    id: Date.now(), userId, userName: user.name, userEmail: user.email,
    amount, address: user.withdrawalAddress!, status: 'pending',
    requestDate: new Date().toISOString(),
  });
  lsSet('withdrawalRequests', reqs);
  addToUserHistory(userId, {
    type: 'withdrawal', title: 'Withdrawal Requested', amount,
    status: 'Pending', txHash: 'Pending approval',
    date: new Date().toLocaleString(), icon: '💸', color: '#EA4335',
  });
  return 'ok';
}

export function approveWithdrawal(requestId: number, txHash: string) {
  const reqs = ls<WithdrawalRequest[]>('withdrawalRequests', []);
  const i = reqs.findIndex(r => r.id === requestId);
  if (i === -1) return;
  const req = reqs[i];
  reqs[i] = { ...req, status: 'approved', approvedDate: new Date().toISOString(), approvedBy: 'admin@demo.com', txHash };
  lsSet('withdrawalRequests', reqs);
  addToUserHistory(req.userId, {
    type: 'withdrawal', title: 'Withdrawal Approved', amount: req.amount,
    status: 'Completed', txHash, date: new Date().toLocaleString(), icon: '✅', color: '#34A853',
  });
  const users = getAllUsers();
  const ui = users.findIndex(u => u.userId === req.userId);
  if (ui !== -1) { users[ui].totalWithdraw = (users[ui].totalWithdraw || 0) + req.amount; lsSet('allUsers', users); }
  logAdminAction('Approved withdrawal', req.userId, req.amount);
}

export function rejectWithdrawal(requestId: number, reason: string) {
  const reqs = ls<WithdrawalRequest[]>('withdrawalRequests', []);
  const i = reqs.findIndex(r => r.id === requestId);
  if (i === -1) return;
  const req = reqs[i];
  reqs[i] = { ...req, status: 'rejected', rejectedDate: new Date().toISOString(), rejectReason: reason };
  lsSet('withdrawalRequests', reqs);
  const users = getAllUsers();
  const ui = users.findIndex(u => u.userId === req.userId);
  if (ui !== -1) {
    users[ui].walletBalance += req.amount;
    users[ui].myActivityHistory.unshift({
      id: Date.now(), type: 'withdrawal', title: 'Withdrawal Rejected',
      amount: req.amount, status: 'Rejected', desc: `Reason: ${reason}`,
      date: new Date().toLocaleString(), icon: '❌', color: '#EA4335',
    });
    lsSet('allUsers', users);
  }
  logAdminAction('Rejected withdrawal', req.userId, req.amount, reason);
}

// ── Auto Rewards ───────────────────────────────────────────────────────────

export function checkAutoRewards(userId: string, depositAmount: number) {
  const s = getRewardSettings();
  const users = getAllUsers();
  const i = users.findIndex(u => u.userId === userId);
  if (i === -1) return;

  // 1. Deposit bonus
  if (s.depositBonus.enabled && depositAmount >= s.depositBonus.minDeposit) {
    const bonus = Math.min(depositAmount * (s.depositBonus.percentage / 100), s.depositBonus.maxBonus);
    users[i].walletBalance += bonus;
    users[i].myActivityHistory.unshift({
      id: Date.now() + 1, type: 'reward', title: 'Deposit Bonus',
      amount: bonus, rewardType: 'Deposit Reward',
      date: new Date().toLocaleString(), icon: '🎁', color: '#FBBC04',
    });
  }

  // 2. Referral bonus
  if (users[i].referredBy && s.referralBonus.enabled) {
    const ui = users.findIndex(u => u.referralCode === users[i].referredBy);
    if (ui !== -1) {
      const rb = +(depositAmount * (s.referralBonus.level1 / 100)).toFixed(2);
      users[ui].walletBalance += rb;
      users[ui].myActivityHistory.unshift({
        id: Date.now() + 2, type: 'commission', title: 'Referral Commission L1',
        amount: rb, from: users[i].name,
        date: new Date().toLocaleString(), icon: '👥', color: '#9C27B0',
      });
    }
  }

  // 3. Level upgrade
  const td = users[i].totalDeposit;
  const l = s.levelSystem;
  const newLevel = td >= l.level4Deposit ? 4 : td >= l.level3Deposit ? 3 : td >= l.level2Deposit ? 2 : 1;
  if (newLevel > users[i].level) {
    const bonus = newLevel === 2 ? l.level2Bonus : newLevel === 3 ? l.level3Bonus : l.level4Bonus;
    users[i].level = newLevel;
    users[i].walletBalance += bonus;
    users[i].myActivityHistory.unshift({
      id: Date.now() + 3, type: 'reward', title: `Level ${newLevel} Achieved!`,
      amount: bonus, rewardType: 'Level Upgrade',
      date: new Date().toLocaleString(), icon: '⭐', color: '#FBBC04',
    });
  }
  lsSet('allUsers', users);
}

// ── Admin Functions ────────────────────────────────────────────────────────

export function logAdminAction(action: string, target: string, amount = 0, details = '') {
  const logs = ls<AdminLog[]>('adminLogs', []);
  logs.unshift({ id: Date.now(), admin: 'admin@demo.com', action, target, amount, details, timestamp: new Date().toISOString() });
  lsSet('adminLogs', logs.slice(0, 200));
}

export function sendAdminNotification(title: string, message: string, type: string) {
  const n = ls<AdminNotif[]>('adminNotifications', []);
  n.unshift({ id: Date.now(), title, message, type, date: new Date().toISOString(), read: [] });
  lsSet('adminNotifications', n);
  logAdminAction('Sent notification', 'all', 0, title);
}

export function sendAirdrop(amount: number) {
  const users = getAllUsers();
  users.forEach(u => {
    u.walletBalance += amount;
    u.myActivityHistory.unshift({
      id: Date.now() + Math.random(), type: 'reward', title: 'Admin Airdrop',
      amount, rewardType: 'Airdrop', date: new Date().toLocaleString(), icon: '🪂', color: '#9C27B0',
    });
  });
  lsSet('allUsers', users);
  const aw = parseFloat(localStorage.getItem('adminWallet') || '0');
  localStorage.setItem('adminWallet', (aw + amount * users.length).toString());
  logAdminAction('Airdrop sent', 'all', amount * users.length, `$${amount} × ${users.length} users`);
}

export function editUserBalance(userId: string, amount: number, type: 'add' | 'sub', reason: string) {
  const users = getAllUsers();
  const i = users.findIndex(u => u.userId === userId);
  if (i === -1) return;
  users[i].walletBalance = type === 'add' ? users[i].walletBalance + amount : Math.max(0, users[i].walletBalance - amount);
  users[i].myActivityHistory.unshift({
    id: Date.now(), type: 'admin',
    title: type === 'add' ? 'Admin Credit' : 'Admin Deduction',
    amount, desc: reason, date: new Date().toLocaleString(),
    icon: type === 'add' ? '🎁' : '⬇️', color: type === 'add' ? '#34A853' : '#EA4335',
  });
  lsSet('allUsers', users);
  logAdminAction(`Balance ${type === 'add' ? 'added' : 'deducted'}`, userId, amount, reason);
}

export function blockUser(userId: string) {
  const users = getAllUsers();
  const i = users.findIndex(u => u.userId === userId);
  if (i === -1) return;
  users[i].isBlocked = !users[i].isBlocked;
  lsSet('allUsers', users);
  logAdminAction(users[i].isBlocked ? 'Blocked user' : 'Unblocked user', userId);
}

export function deleteUser(userId: string) {
  lsSet('allUsers', getAllUsers().filter(u => u.userId !== userId));
  logAdminAction('Deleted user', userId);
}

// ── Settings ───────────────────────────────────────────────────────────────

export function getRewardSettings(): RewardSettings {
  return ls<RewardSettings>('rewardSettings', {
    depositBonus: { enabled: true, percentage: 10, minDeposit: 50, maxBonus: 500 },
    referralBonus: { enabled: true, level1: 5, level2: 3, level3: 1 },
    activityReward: { enabled: true, dailyLogin: 1, reserveNFT: 2, completeProfile: 5 },
    reservationSettings: { enabled: true, minAmount: 10, maxAmount: 500, profitPercentage: 15, lockPeriodDays: 7 },
    levelSystem: { level2Deposit: 100, level2Bonus: 20, level3Deposit: 500, level3Bonus: 50, level4Deposit: 1000, level4Bonus: 100 },
  });
}

export function getWithdrawalSettings(): WithdrawalSettings {
  return ls<WithdrawalSettings>('withdrawalSettings', {
    enabled: true, startTime: '00:00', endTime: '23:59',
    minAmount: 10, maxAmount: 1000, requireGoogleAuth: false,
    requireAddressBind: false, bindDelayHours: 0,
  });
}

export function saveRewardSettings(s: RewardSettings) { lsSet('rewardSettings', s); logAdminAction('Updated reward settings', 'system'); }
export function saveWithdrawalSettings(s: WithdrawalSettings) { lsSet('withdrawalSettings', s); logAdminAction('Updated withdrawal settings', 'system'); }

// ── Notifications ──────────────────────────────────────────────────────────

export function getAdminNotifications(): AdminNotif[] { return ls<AdminNotif[]>('adminNotifications', []); }

export function markNotifRead(notifId: number, userId: string) {
  const n = getAdminNotifications();
  const i = n.findIndex(x => x.id === notifId);
  if (i !== -1 && !n[i].read.includes(userId)) { n[i].read.push(userId); lsSet('adminNotifications', n); }
}

export function markAllNotifsRead(userId: string) {
  const n = getAdminNotifications().map(x => x.read.includes(userId) ? x : { ...x, read: [...x.read, userId] });
  lsSet('adminNotifications', n);
}

// ── Admin Session ──────────────────────────────────────────────────────────

export function isAdminLoggedIn(): boolean { return localStorage.getItem('adminLoggedIn') === 'true'; }
export function adminLogin(email: string, password: string): boolean {
  if (email === 'admin@demo.com' && password === 'admin123') { localStorage.setItem('adminLoggedIn', 'true'); return true; }
  return false;
}
export function adminLogout() { localStorage.removeItem('adminLoggedIn'); }
