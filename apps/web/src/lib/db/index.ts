import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import path from 'path';

// Use local SQLite database file
const dbPath = path.resolve(process.cwd(), 'scs_content_studio.db');
const client = createClient({
  url: `file:${dbPath}`,
});

export const db = drizzle(client, { schema });

let isInitialized = false;

export async function ensureDbInitialized() {
  if (isInitialized) return;

  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      repo_url TEXT,
      docs_url TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    );

    CREATE TABLE IF NOT EXISTS sources (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS product_briefs (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      one_liner TEXT,
      problem TEXT,
      audience TEXT,
      features TEXT,
      differentiators TEXT,
      pricing TEXT,
      integrations TEXT,
      recent_updates TEXT,
      faqs TEXT,
      raw_json TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS content_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      target_site TEXT NOT NULL,
      tone TEXT,
      length TEXT,
      platform TEXT,
      cta TEXT,
      prompt_template TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      target_site TEXT NOT NULL,
      status TEXT NOT NULL,
      prompt TEXT NOT NULL,
      result_markdown TEXT,
      media_urls TEXT,
      error TEXT,
      screenshot_url TEXT,
      created_at INTEGER NOT NULL,
      completed_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS generations (
      id TEXT PRIMARY KEY,
      job_id TEXT,
      product_id TEXT,
      template_id TEXT,
      title TEXT NOT NULL,
      content_markdown TEXT NOT NULL,
      media_urls TEXT,
      is_favorite INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (job_id) REFERENCES jobs(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (template_id) REFERENCES content_templates(id)
    );
  `);

  // Ensure default workspace exists
  const existing = await client.execute({
    sql: 'SELECT id FROM workspaces WHERE id = ?',
    args: ['default-workspace'],
  });

  if (existing.rows.length === 0) {
    await client.execute({
      sql: 'INSERT INTO workspaces (id, name, created_at) VALUES (?, ?, ?)',
      args: ['default-workspace', 'My Workspace', Date.now()],
    });
  }

  isInitialized = true;
}
