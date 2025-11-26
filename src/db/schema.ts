import { pgTable, text, timestamp, uuid, boolean, date, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table (Parents)
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: varchar('phone', { length: 20 }).notNull(),
  password: text('password').notNull(), // Hashed password
  emailVerified: boolean('email_verified').default(false).notNull(),
  emailVerificationToken: text('email_verification_token'),
  emailVerificationExpires: timestamp('email_verification_expires'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Children table
export const children = pgTable('children', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  dateOfBirth: date('date_of_birth').notNull(),
  birthCertificateUrl: text('birth_certificate_url'),
  birthCertificateVerified: boolean('birth_certificate_verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Vaccine records table
export const vaccineRecords = pgTable('vaccine_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  childId: uuid('child_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
  vaccineName: text('vaccine_name').notNull(),
  vaccineCategory: text('vaccine_category').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, taken, skipped
  takenDate: date('taken_date'),
  proofUrl: text('proof_url'), // URL to uploaded proof document
  proofVerified: boolean('proof_verified').default(false).notNull(), // Whether proof has been verified
  ageMilestone: text('age_milestone').notNull(), // birth, 6weeks, 10weeks, 14weeks, 9-12months, 16-24months, 5-6years, 10-16years
  sequenceOrder: text('sequence_order').notNull(), // order within age milestone
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  children: many(children),
}));

export const childrenRelations = relations(children, ({ one, many }) => ({
  parent: one(users, {
    fields: [children.userId],
    references: [users.id],
  }),
  vaccineRecords: many(vaccineRecords),
}));

export const vaccineRecordsRelations = relations(vaccineRecords, ({ one }) => ({
  child: one(children, {
    fields: [vaccineRecords.childId],
    references: [children.id],
  }),
}));

