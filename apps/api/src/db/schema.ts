import {
  pgTable,
  text,
  boolean,
  timestamp,
  uuid,
  integer,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
  bigserial,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const operatorEnum = pgEnum('operator', [
  'equals',
  'not_equals',
  'contains',
  'in',
]);

// Users Table
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull(),
    name: text('name').notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('users_email_unique').on(table.email)],
);

// Projects Table
export const projects = pgTable(
  'projects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    publishableKey: text('publishable_key').notNull().unique(),
    secretKey: text('secret_key').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    createdBy: uuid('created_by').references(() => users.id),
    updatedBy: uuid('updated_by').references(() => users.id),
  },
  (table) => [
    uniqueIndex('projects_pk_idx').on(table.publishableKey),
    uniqueIndex('projects_sk_idx').on(table.secretKey),
  ],
);

// Feature Flags Table
export const flags = pgTable(
  'flags',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .references(() => projects.id)
      .notNull(),
    key: text('key').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    enabled: boolean('enabled').notNull().default(false),
    isClientSide: boolean('is_client_side').notNull().default(false),
    defaultValue: boolean('default_value').notNull().default(false),
    isArchived: boolean('is_archived').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    archivedAt: timestamp('archived_at'),
    createdBy: uuid('created_by').references(() => users.id),
    updatedBy: uuid('updated_by').references(() => users.id),
    archivedBy: uuid('archived_by').references(() => users.id),
  },
  (t) => [
    // Composite unique key for project + flag key
    uniqueIndex('flags_project_key_unique').on(t.projectId, t.key),
  ],
);

// Targeting Rules Table
export const targetingRules = pgTable(
  'targeting_rules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    flagId: uuid('flag_id')
      .references(() => flags.id)
      .notNull(),
    attribute: text('attribute').notNull(),
    operator: operatorEnum('operator').notNull(),
    value: jsonb('value').notNull(),
    rolloutPercentage: integer('rollout_percentage').notNull().default(100),
    priority: integer('priority').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    createdBy: uuid('created_by').references(() => users.id),
    updatedBy: uuid('updated_by').references(() => users.id),
  },
  (table) => [index('tr_flag_idx').on(table.flagId)],
);

// Flag Evaluations (Analytics) Table
export const flagEvaluations = pgTable(
  'flag_evaluations',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    flagId: uuid('flag_id')
      .references(() => flags.id)
      .notNull(),
    userId: text('user_id'),
    result: boolean('result').notNull(),
    evaluatedAt: timestamp('evaluated_at').defaultNow().notNull(),
    reason: text('reason'),
  },
  (t) => [
    index('evals_flag_idx').on(t.flagId),
    index('evals_user_idx').on(t.userId),
    index('evals_time_idx').on(t.evaluatedAt),
  ],
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects, { relationName: 'projectCreator' }),
}));

export const projectsRelations = relations(projects, ({ many, one }) => ({
  flags: many(flags),
  creator: one(users, {
    fields: [projects.createdBy],
    references: [users.id],
    relationName: 'projectCreator',
  }),
  updator: one(users, {
    fields: [projects.updatedBy],
    references: [users.id],
    relationName: 'projectUpdator',
  }),
}));

export const flagsRelations = relations(flags, ({ one, many }) => ({
  project: one(projects, {
    fields: [flags.projectId],
    references: [projects.id],
  }),
  rules: many(targetingRules),
  evaluations: many(flagEvaluations),
}));

export const targetingRulesRelations = relations(targetingRules, ({ one }) => ({
  flag: one(flags, {
    fields: [targetingRules.flagId],
    references: [flags.id],
  }),
}));

export const flagEvaluationsRelations = relations(
  flagEvaluations,
  ({ one }) => ({
    flag: one(flags, {
      fields: [flagEvaluations.flagId],
      references: [flags.id],
    }),
  }),
);
