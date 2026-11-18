import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const workspaces = sqliteTable('workspaces', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id),
  name: text('name').notNull(),
  description: text('description'),
  repoUrl: text('repo_url'),
  docsUrl: text('docs_url'),
  createdAt: integer('created_at').notNull(),
});

export const sources = sqliteTable('sources', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull().references(() => products.id),
  type: text('type').notNull(), // 'github' | 'url' | 'upload' | 'note'
  title: text('title').notNull(),
  content: text('content').notNull(),
  metadata: text('metadata'), // JSON
  createdAt: integer('created_at').notNull(),
});

export const productBriefs = sqliteTable('product_briefs', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull().references(() => products.id),
  oneLiner: text('one_liner'),
  problem: text('problem'),
  audience: text('audience'),
  features: text('features'),
  differentiators: text('differentiators'),
  pricing: text('pricing'),
  integrations: text('integrations'),
  recentUpdates: text('recent_updates'),
  faqs: text('faqs'),
  rawJson: text('raw_json'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const contentTemplates = sqliteTable('content_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  targetSite: text('target_site').notNull(), // 'chatgpt' | 'gemini' | 'flow'
  tone: text('tone'),
  length: text('length'),
  platform: text('platform'),
  cta: text('cta'),
  promptTemplate: text('prompt_template').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const jobs = sqliteTable('jobs', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull(),
  targetSite: text('target_site').notNull(), // 'chatgpt' | 'gemini' | 'flow'
  status: text('status').notNull(), // 'queued' | 'running' | 'paused' | 'completed' | 'failed'
  prompt: text('prompt').notNull(),
  resultMarkdown: text('result_markdown'),
  mediaUrls: text('media_urls'), // JSON array
  error: text('error'),
  screenshotUrl: text('screenshot_url'),
  createdAt: integer('created_at').notNull(),
  completedAt: integer('completed_at'),
});

export const generations = sqliteTable('generations', {
  id: text('id').primaryKey(),
  jobId: text('job_id').references(() => jobs.id),
  productId: text('product_id').references(() => products.id),
  templateId: text('template_id').references(() => contentTemplates.id),
  title: text('title').notNull(),
  contentMarkdown: text('content_markdown').notNull(),
  mediaUrls: text('media_urls'),
  isFavorite: integer('is_favorite').default(0),
  createdAt: integer('created_at').notNull(),
});
