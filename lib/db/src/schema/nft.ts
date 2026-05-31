import {
  pgTable, text, serial, timestamp, varchar,
  boolean, integer, numeric,
} from "drizzle-orm/pg-core";

export const nftUsers = pgTable("nft_users", {
  id:                serial("id").primaryKey(),
  email:             varchar("email", { length: 255 }).notNull().unique(),
  passwordHash:      text("password_hash").notNull(),
  name:              text("name").notNull(),
  username:          varchar("username", { length: 100 }),
  phone:             varchar("phone", { length: 50 }),
  country:           varchar("country", { length: 20 }),
  myReferralCode:    varchar("my_referral_code", { length: 50 }).notNull().unique(),
  joinedWithCode:    varchar("joined_with_code", { length: 50 }),
  coins:             integer("coins").default(0).notNull(),
  walletBalance:     numeric("wallet_balance",      { precision: 14, scale: 2 }).default("0").notNull(),
  nftAccountBalance: numeric("nft_account_balance", { precision: 14, scale: 2 }).default("0").notNull(),
  totalDeposit:      numeric("total_deposit",       { precision: 14, scale: 2 }).default("0").notNull(),
  totalWithdraw:     numeric("total_withdraw",      { precision: 14, scale: 2 }).default("0").notNull(),
  reserveIncome:     numeric("reserve_income",      { precision: 14, scale: 2 }).default("0").notNull(),
  teamIncome:        numeric("team_income",         { precision: 14, scale: 2 }).default("0").notNull(),
  activityIncome:    numeric("activity_income",     { precision: 14, scale: 2 }).default("0").notNull(),
  level:             integer("level").default(1).notNull(),
  isAdmin:           boolean("is_admin").default(false).notNull(),
  isBlocked:         boolean("is_blocked").default(false).notNull(),
  googleAuthBound:   boolean("google_auth_bound").default(false).notNull(),
  withdrawalAddress: text("withdrawal_address"),
  bep20Address:      text("bep20_address"),
  trc20Address:      text("trc20_address"),
  addressBindDate:   timestamp("address_bind_date"),
  resetToken:        text("reset_token"),
  resetTokenExpiry:  timestamp("reset_token_expiry"),
  otpCode:           text("otp_code"),
  otpExpiry:         timestamp("otp_expiry"),
  isVerified:        boolean("is_verified").default(false).notNull(),
  registeredAt:      timestamp("registered_at").defaultNow().notNull(),
  lastLogin:         timestamp("last_login").defaultNow().notNull(),
});

export const nftOrders = pgTable("nft_orders", {
  id:       serial("id").primaryKey(),
  userId:   integer("user_id").notNull(),
  nftName:  text("nft_name").notNull(),
  nftImage: text("nft_image").notNull(),
  nftPrice: numeric("nft_price", { precision: 14, scale: 2 }).notNull(),
  status:   varchar("status", { length: 20 }).default("bought").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  soldAt:   timestamp("sold_at"),
});

export const nftSettings = pgTable("nft_settings", {
  key:       varchar("key", { length: 100 }).primaryKey(),
  value:     text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const nftReferrals = pgTable("nft_referrals", {
  id:           serial("id").primaryKey(),
  referrerCode: varchar("referrer_code", { length: 50 }).notNull(),
  newUserEmail: varchar("new_user_email", { length: 255 }).notNull(),
  newUserId:    integer("new_user_id").notNull(),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
});

export const nftWithdrawals = pgTable("nft_withdrawals", {
  id:           serial("id").primaryKey(),
  userId:       integer("user_id").notNull(),
  userEmail:    varchar("user_email", { length: 255 }).notNull(),
  userName:     text("user_name").notNull(),
  amount:       numeric("amount", { precision: 14, scale: 2 }).notNull(),
  address:      text("address").notNull(),
  network:      varchar("network", { length: 20 }).default("TRC20").notNull(),
  status:       varchar("status", { length: 20 }).default("pending").notNull(),
  txHash:       text("tx_hash"),
  rejectReason: text("reject_reason"),
  requestedAt:  timestamp("requested_at").defaultNow().notNull(),
  processedAt:  timestamp("processed_at"),
});

export const nftDeposits = pgTable("nft_deposits", {
  id:           serial("id").primaryKey(),
  userId:       integer("user_id").notNull(),
  userEmail:    varchar("user_email", { length: 255 }).notNull(),
  userName:     text("user_name").notNull(),
  amount:       numeric("amount", { precision: 14, scale: 2 }).notNull(),
  network:      varchar("network", { length: 20 }).default("BEP20").notNull(),
  txHash:       text("tx_hash"),
  status:       varchar("status", { length: 20 }).default("pending").notNull(),
  rejectReason: text("reject_reason"),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
  processedAt:  timestamp("processed_at"),
});

export const nftNotifications = pgTable("nft_notifications", {
  id:        serial("id").primaryKey(),
  title:     text("title").notNull(),
  message:   text("message").notNull(),
  type:      varchar("type", { length: 50 }).default("info").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const nftAdminLogs = pgTable("nft_admin_logs", {
  id:        serial("id").primaryKey(),
  admin:     varchar("admin", { length: 255 }).notNull(),
  action:    text("action").notNull(),
  target:    text("target").notNull(),
  amount:    numeric("amount", { precision: 14, scale: 2 }).default("0").notNull(),
  details:   text("details").default("").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
