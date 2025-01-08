import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  username: text('username').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now()),
});

export const auth = sqliteTable('auth', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  password: text('password').notNull(),
});
