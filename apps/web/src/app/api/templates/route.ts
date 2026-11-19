import { NextResponse } from 'next/server';
import { db, ensureDbInitialized } from '@/lib/db';
import { contentTemplates, productBriefs, products } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/templates - List all content templates
export async function GET() {
  try {
    await ensureDbInitialized();
    const allTemplates = await db.select().from(contentTemplates).orderBy(desc(contentTemplates.createdAt));

    return NextResponse.json({
      status: 'ok',
      templates: allTemplates,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', message: err.message || 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/templates - Save, update, delete or interpolate templates
export async function POST(request: Request) {
  try {
    await ensureDbInitialized();
    const body = await request.json();
    const { action } = body;

    // 1. Interpolate template with Product Brief
    if (action === 'interpolate') {
      const { templateId, productId = 'default-product' } = body;
      const [tpl] = await db.select().from(contentTemplates).where(eq(contentTemplates.id, templateId)).limit(1);
      if (!tpl) {
        return NextResponse.json({ status: 'error', message: 'Template not found' }, { status: 404 });
      }

      const [brief] = await db.select().from(productBriefs).where(eq(productBriefs.productId, productId)).orderBy(desc(productBriefs.updatedAt)).limit(1);
      const [prod] = await db.select().from(products).where(eq(products.id, productId)).limit(1);

      let assembled = tpl.promptTemplate;
      const replacements: Record<string, string> = {
        '{{productName}}': prod?.name || 'SaaS Content Studio',
        '{{oneLiner}}': brief?.oneLiner || 'AI-driven content generation studio powered by real browser sessions.',
        '{{problem}}': brief?.problem || 'High API costs and restrictive rate limits.',
        '{{audience}}': brief?.audience || 'Solo founders, content creators, and growth marketers.',
        '{{features}}': brief?.features || 'Chrome extension, ChatGPT/Gemini automation, Flow video generation.',
        '{{differentiators}}': brief?.differentiators || 'Zero API keys required; runs directly in personal browser accounts.',
        '{{pricing}}': brief?.pricing || 'Free open-source local engine. Team cloud sync at $29/mo.',
        '{{integrations}}': brief?.integrations || 'Chrome Manifest V3, ChatGPT, Gemini, Google Flow.',
        '{{cta}}': tpl.cta || 'Try it now or star on GitHub',
      };

      for (const [key, val] of Object.entries(replacements)) {
        assembled = assembled.replaceAll(key, val);
      }

      return NextResponse.json({
        status: 'ok',
        template: tpl,
        interpolatedPrompt: assembled,
        targetSite: tpl.targetSite,
      });
    }

    // 2. Save or update template
    if (action === 'save') {
      const { id, name, slug, targetSite, tone, length, platform, cta, promptTemplate } = body;
      const tplId = id || `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const now = Date.now();

      const record = {
        name: name || 'Untitled Template',
        slug: slug || name?.toLowerCase().replace(/\s+/g, '-') || 'custom-template',
        targetSite: targetSite || 'both',
        tone: tone || 'Authoritative and punchy',
        length: length || 'Standard length',
        platform: platform || 'General Web',
        cta: cta || 'Learn more',
        promptTemplate: promptTemplate || '',
        createdAt: now,
      };

      if (id) {
        await db.update(contentTemplates).set(record).where(eq(contentTemplates.id, id));
      } else {
        await db.insert(contentTemplates).values({ id: tplId, ...record });
      }

      return NextResponse.json({ status: 'ok', templateId: tplId });
    }

    // 3. Delete template
    if (action === 'delete') {
      const { id } = body;
      if (!id) return NextResponse.json({ status: 'error', message: 'id required' }, { status: 400 });
      await db.delete(contentTemplates).where(eq(contentTemplates.id, id));
      return NextResponse.json({ status: 'ok', deletedId: id });
    }

    return NextResponse.json({ status: 'error', message: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', message: err.message || 'Error processing template request' },
      { status: 500 }
    );
  }
}
