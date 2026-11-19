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

  // Ensure initial content templates are seeded
  const existingTemplates = await client.execute({
    sql: 'SELECT count(*) as count FROM content_templates',
    args: [],
  });

  const templateCount = Number(existingTemplates.rows[0]?.count || 0);
  if (templateCount === 0) {
    const defaultTemplates = [
      {
        id: 'tpl_blog_post',
        name: 'Technical Blog Post',
        slug: 'blog-post',
        targetSite: 'chatgpt',
        tone: 'Authoritative, developer-first, pragmatic',
        length: '1,200 - 1,800 words',
        platform: 'Hashnode / Dev.to / Company Blog',
        cta: 'Star the repo on GitHub or try the local engine',
        promptTemplate: `Write a comprehensive, technical thought-leadership blog post for "{{productName}}".
Value Proposition: {{oneLiner}}
Core Problem Solved: {{problem}}
Target Audience: {{audience}}
Key Architecture & Capabilities: {{features}}
Differentiators & Moat: {{differentiators}}

Structure:
1. Compelling narrative opening exposing the hidden flaw in traditional tools
2. Architectural deep dive into how human-session automation solves it
3. Practical code or workflow walkthrough
4. Benchmark comparison vs per-token APIs
5. Call to action: {{cta}}`,
      },
      {
        id: 'tpl_linkedin_post',
        name: 'Viral LinkedIn Founder Post',
        slug: 'linkedin-post',
        targetSite: 'both',
        tone: 'High-signal, punchy, conversational, no fluff',
        length: '250 - 350 words',
        platform: 'LinkedIn',
        cta: 'Comment "studio" for early access link',
        promptTemplate: `Write a high-converting LinkedIn post announcing "{{productName}}".
Core One-Liner: {{oneLiner}}
Audience: {{audience}}
The Pain Point: {{problem}}
Key Differentiator: {{differentiators}}

Formatting rules:
- Start with a punchy 1-line hook that challenges conventional thinking
- Use short sentences with double line breaks
- Include 3 concise bullet points with emojis
- End with a low-friction question CTA: {{cta}}`,
      },
      {
        id: 'tpl_x_thread',
        name: 'Viral X/Twitter Breakdown Thread',
        slug: 'x-thread',
        targetSite: 'chatgpt',
        tone: 'Snappy, provocative, high-velocity, insight-dense',
        length: '7 tweets (280 chars each)',
        platform: 'X / Twitter',
        cta: 'Retweet the first tweet and join the waitlist',
        promptTemplate: `Write a 7-tweet viral breakdown thread launching "{{productName}}".
Value Prop: {{oneLiner}}
Problem: {{problem}}
Features: {{features}}
Moat: {{differentiators}}

Format:
Tweet 1: High-impact hook + teaser
Tweet 2: Why APIs are breaking SaaS budgets and getting bot-blocked
Tweet 3: The breakthrough: Human browser session orchestration
Tweet 4: Side-by-side ChatGPT and Gemini prompt arena
Tweet 5: Pipeline from brief to Google Flow video prompts
Tweet 6: Open source, local-first privacy architecture
Tweet 7: Recap + CTA: {{cta}}`,
      },
      {
        id: 'tpl_landing_page',
        name: 'High-Converting Landing Page Copy',
        slug: 'landing-page-copy',
        targetSite: 'both',
        tone: 'Persuasive, clean, developer-focused, benefit-driven',
        length: 'Full Page (Hero to FAQ)',
        platform: 'Marketing Site / Web Landing Page',
        cta: 'Start Free Locally &bull; No Credit Card Required',
        promptTemplate: `Generate full landing page copy for "{{productName}}".
One-Liner: {{oneLiner}}
Problem: {{problem}}
Audience: {{audience}}
Features: {{features}}
Differentiators: {{differentiators}}
Pricing: {{pricing}}

Sections required:
1. HERO: Punchy Headline (H1), Subheadline (H2), Primary CTA, Secondary Link, Social proof badge
2. PROBLEM (Pain Points): 3 visceral frustrations users feel today
3. SOLUTION: How {{productName}} re-architects the workflow
4. FEATURE GRID: 4 core capabilities with benefit-driven microcopy
5. SOCIAL PROOF / TESTIMONIAL MOCKUPS
6. PRICING TIERS: Free Local vs Team Cloud
7. FINAL HERO CTA`,
      },
      {
        id: 'tpl_launch_email',
        name: 'Product Hunt / Launch Email',
        slug: 'launch-email',
        targetSite: 'gemini',
        tone: 'Warm, exciting, authentic founder voice',
        length: '300 - 450 words',
        platform: 'Email Newsletter / Waitlist',
        cta: 'Check out the launch & upvote on Product Hunt',
        promptTemplate: `Write an authentic founder launch email for "{{productName}}".
Subject Line Options: 3 catchy, high-open-rate subject lines
Value Proposition: {{oneLiner}}
What we built & why: {{problem}} -> {{features}}
Special launch perk / pricing: {{pricing}}
CTA: {{cta}}`,
      },
      {
        id: 'tpl_youtube_script',
        name: 'YouTube Video Tutorial & Demo Script',
        slug: 'youtube-script',
        targetSite: 'chatgpt',
        tone: 'Engaging, technical, enthusiastic, clear pacing',
        length: '5 - 7 minutes (~800 words)',
        platform: 'YouTube',
        cta: 'Subscribe and download from GitHub in description',
        promptTemplate: `Write a full video script for a 5-minute YouTube demo of "{{productName}}".
Value Prop: {{oneLiner}}
Features: {{features}}

Include:
- [0:00 - 0:30] Hook & Visual Demo Preview
- [0:30 - 1:30] The Problem with traditional API wrappers
- [1:30 - 3:30] Live Walkthrough: Ingestion -> Side-by-Side Arena -> Flow Videos
- [3:30 - 4:30] Safety, session reuse, and zero API costs
- [4:30 - 5:00] Wrap up & CTA: {{cta}}
Format with [HOST ON CAMERA] and [SCREEN RECORDING] cues.`,
      },
      {
        id: 'tpl_short_video',
        name: 'Short-Form Video Script (Reels/TikTok/Shorts)',
        slug: 'short-video-script',
        targetSite: 'gemini',
        tone: 'Fast-paced, pattern-interrupting, punchy',
        length: '30 - 45 seconds (~100 words)',
        platform: 'TikTok / YouTube Shorts / IG Reels',
        cta: 'Link in bio to try it free',
        promptTemplate: `Write a 30-second vertical video script for "{{productName}}".
Target: {{audience}}
Hook: {{oneLiner}}
Split into 4 discrete scene prompts formatted for Google Flow video generation:
Scene 1 (0-8s): The hook & visual pattern interrupt
Scene 2 (8-16s): The pain of token limits & API bills
Scene 3 (16-24s): The browser session takeover magic
Scene 4 (24-30s): Call to action: {{cta}}`,
      },
      {
        id: 'tpl_seo_pack',
        name: 'Comprehensive SEO & Meta Pack',
        slug: 'seo-pack',
        targetSite: 'gemini',
        tone: 'Search-intent focused, click-worthy, optimized',
        length: 'Full metadata specification',
        platform: 'Search Engines / Google Search',
        cta: 'Search result click',
        promptTemplate: `Create a comprehensive SEO & Metadata pack for "{{productName}}".
One-Liner: {{oneLiner}}
Features: {{features}}

Generate:
1. Primary target keyword & 6 long-tail semantic variants
2. Meta Title (under 60 characters)
3. Meta Description (under 155 characters)
4. OpenGraph Title & Description
5. Recommended H1, H2, and H3 structural page outline
6. JSON-LD SoftwareApplication schema markup snippet`,
      },
      {
        id: 'tpl_faq_pack',
        name: 'Conversion Objection FAQ Pack',
        slug: 'faq-pack',
        targetSite: 'both',
        tone: 'Empathetic, reassuring, direct, transparent',
        length: '8 comprehensive FAQs',
        platform: 'Website / Documentation / Sales Collateral',
        cta: 'Read docs or ask in Discord',
        promptTemplate: `Generate the top 8 high-friction customer FAQs for "{{productName}}".
Product: {{oneLiner}}
Features: {{features}}
Differentiators: {{differentiators}}
Pricing: {{pricing}}

Cover:
1. How does it work without API keys?
2. Is my account safe from bans? (Detail human delays)
3. What happens if ChatGPT or Gemini changes their UI?
4. How is it free?
5. Can I use my existing ChatGPT Plus / Gemini Advanced perks?
6. Does it support custom team templates?
7. Is my data kept private and local?
8. What is the future cloud sync pricing?`,
      },
    ];

    for (const tpl of defaultTemplates) {
      await client.execute({
        sql: `INSERT OR REPLACE INTO content_templates 
              (id, name, slug, target_site, tone, length, platform, cta, prompt_template, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          tpl.id,
          tpl.name,
          tpl.slug,
          tpl.targetSite,
          tpl.tone,
          tpl.length,
          tpl.platform,
          tpl.cta,
          tpl.promptTemplate,
          Date.now(),
        ],
      });
    }
  }

  isInitialized = true;
}
