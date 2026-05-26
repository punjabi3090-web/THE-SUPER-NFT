import { pgTable, text, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phoneCountryCode: varchar("phone_country_code", { length: 10 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 30 }).notNull(),
  referralCode: varchar("referral_code", { length: 50 }),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

export const pendingVerificationsTable = pgTable("pending_verifications", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  userData: text("user_data").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const passwordResetTokensTable = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
