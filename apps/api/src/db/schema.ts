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

export const apiKeyTypeEnum = pgEnum('api_key_type', ['publishable', 'secret']);

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
export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
});

export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .references(() => projects.id)
      .notNull(),
    name: text('name').notNull(),
    type: apiKeyTypeEnum('type').notNull(),
    // Only store hash for verification - plaintext key shown once on creation
    keyHash: text('key_hash').notNull(),
    // First 12 chars for UI display (e.g., "sk_a1b2c3d4...")
    keyPrefix: text('key_prefix').notNull(),
    lastUsedAt: timestamp('last_used_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    revokedAt: timestamp('revoked_at'),
    createdBy: uuid('created_by').references(() => users.id),
    revokedBy: uuid('revoked_by').references(() => users.id),
  },
  (table) => [
    index('api_keys_project_idx').on(table.projectId),
    uniqueIndex('api_keys_hash_unique').on(table.keyHash),
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
  apiKeys: many(apiKeys),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  project: one(projects, {
    fields: [apiKeys.projectId],
    references: [projects.id],
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
