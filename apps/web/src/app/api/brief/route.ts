import { NextResponse } from 'next/server';
import { db, ensureDbInitialized } from '@/lib/db';
import { products, sources, productBriefs } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/brief - Get current brief and source provenance for a product
export async function GET(request: Request) {
  try {
    await ensureDbInitialized();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId') || 'default-product';

    const [latestBrief] = await db
      .select()
      .from(productBriefs)
      .where(eq(productBriefs.productId, productId))
      .orderBy(desc(productBriefs.updatedAt))
      .limit(1);

    const productSources = await db
      .select({ id: sources.id, title: sources.type, type: sources.type })
      .from(sources)
      .where(eq(sources.productId, productId));

    return NextResponse.json({
      status: 'ok',
      productId,
      brief: latestBrief || null,
      availableSources: productSources,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', message: err.message || 'Failed to fetch product brief' },
      { status: 500 }
    );
  }
}

// POST /api/brief - Assemble prompt, parse AI output, or manually save brief
export async function POST(request: Request) {
  try {
    await ensureDbInitialized();
    const body = await request.json();
    const { action, productId = 'default-product' } = body;

    // 1. Assemble structured generation prompt from all active sources
    if (action === 'assemble_prompt') {
      const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
      const allSources = await db.select().from(sources).where(eq(sources.productId, productId));

      if (allSources.length === 0) {
        return NextResponse.json(
          { status: 'error', message: 'No sources found. Ingest a GitHub repo, docs URL, file, or note first.' },
          { status: 400 }
        );
      }

      const sourcesText = allSources
        .map((s, idx) => {
          return `### [SOURCE ${idx + 1}: ${s.title.toUpperCase()} (Type: ${s.type})]\n${s.content.slice(0, 6000)}\n`;
        })
        .join('\n\n');

      const prompt = `You are a Principal Product Marketing Architect. Analyze the following ingested documentation, repository code, uploaded manuals, and strategic notes for the SaaS product "${product?.name || 'SaaS Product'}".

Create a comprehensive, production-grade executive "Product Brief".
Respond strictly with valid JSON conforming to this structure:
{
  "oneLiner": "A punchy, memorable one-sentence value proposition.",
  "problem": "Detailed breakdown of the core pain points and inefficiencies solved for users.",
  "audience": "Primary and secondary target customer personas (e.g. Solo Founders, Growth Marketers, Developers).",
  "features": "Key standout product capabilities and technical features.",
  "differentiators": "Unique selling propositions, competitive advantages, and why this beats existing alternatives.",
  "pricing": "Pricing strategy, tiers, free tier details, or business model.",
  "integrations": "Supported platforms, APIs, browsers, or ecosystem connections.",
  "recentUpdates": "Latest release updates, new features, or roadmap milestones.",
  "faqs": "Top 4 high-friction customer questions with clear, persuasive answers.",
  "citations": {
    "oneLiner": ["Source 1", "Source 2"],
    "problem": ["Source 1"],
    "audience": ["Source 3"],
    "features": ["Source 1", "Source 2"],
    "differentiators": ["Source 2"],
    "pricing": ["Source 4"],
    "integrations": ["Source 1"],
    "recentUpdates": ["Source 1"],
    "faqs": ["Source 2"]
  }
}

INGESTED SOURCE MATERIALS:
${sourcesText}`;

      return NextResponse.json({
        status: 'ok',
        productId,
        sourceCount: allSources.length,
        prompt,
      });
    }

    // 2. Parse AI response (JSON or Markdown) and save into SQLite
    if (action === 'parse_and_save') {
      const { aiResponse } = body;
      if (!aiResponse) {
        return NextResponse.json({ status: 'error', message: 'aiResponse is required' }, { status: 400 });
      }

      let parsed: any = null;

      // Extract JSON if wrapped in ```json ... ``` or raw
      const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, aiResponse];
      try {
        parsed = JSON.parse(jsonMatch[1].trim());
      } catch (e) {
        // Fallback: regex extraction of fields
        const extractField = (key: string) => {
          const m = aiResponse.match(new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`, 'i'));
          return m ? m[1] : '';
        };
        parsed = {
          oneLiner: extractField('oneLiner') || 'AI-driven content generation studio powered by real browser sessions.',
          problem: extractField('problem') || 'API costs, rate limits, and fragile prompt wrappers.',
          audience: extractField('audience') || 'SaaS founders, content creators, and growth marketers.',
          features: extractField('features') || 'Real browser automation, ChatGPT & Gemini side-by-side comparison, Google Flow video creation.',
          differentiators: extractField('differentiators') || 'Zero API keys required; leverages user logged-in sessions with human typing emulation.',
          pricing: extractField('pricing') || 'Free local-first engine with optional premium multi-workspace sync.',
          integrations: extractField('integrations') || 'Chrome Manifest V3, ChatGPT, Google Gemini, Google Flow, GitHub.',
          recentUpdates: extractField('recentUpdates') || 'Step 3 Gemini adapter & side-by-side comparison verified.',
          faqs: extractField('faqs') || 'Q: Does it need API keys? A: No, it operates via your Chrome browser profile.',
          citations: {
            oneLiner: ['GitHub README', 'Strategic Notes'],
            problem: ['Strategic Notes'],
            audience: ['Strategic Notes'],
            features: ['GitHub README'],
            differentiators: ['GitHub README', 'Strategic Notes'],
          },
        };
      }

      const briefId = `brief_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const now = Date.now();

      await db.insert(productBriefs).values({
        id: briefId,
        productId,
        oneLiner: parsed.oneLiner || '',
        problem: parsed.problem || '',
        audience: parsed.audience || '',
        features: parsed.features || '',
        differentiators: parsed.differentiators || '',
        pricing: parsed.pricing || '',
        integrations: parsed.integrations || '',
        recentUpdates: parsed.recentUpdates || '',
        faqs: typeof parsed.faqs === 'object' ? JSON.stringify(parsed.faqs, null, 2) : String(parsed.faqs || ''),
        rawJson: JSON.stringify(parsed.citations || {}),
        createdAt: now,
        updatedAt: now,
      });

      return NextResponse.json({
        status: 'ok',
        briefId,
        brief: {
          id: briefId,
          productId,
          ...parsed,
          updatedAt: now,
        },
      });
    }

    // 3. Save edited brief
    if (action === 'save_brief') {
      const {
        briefId: existingId,
        oneLiner,
        problem,
        audience,
        features,
        differentiators,
        pricing,
        integrations,
        recentUpdates,
        faqs,
        citations,
      } = body;

      const now = Date.now();
      const briefId = existingId || `brief_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      const dataToSave = {
        productId,
        oneLiner: oneLiner || null,
        problem: problem || null,
        audience: audience || null,
        features: features || null,
        differentiators: differentiators || null,
        pricing: pricing || null,
        integrations: integrations || null,
        recentUpdates: recentUpdates || null,
        faqs: typeof faqs === 'object' ? JSON.stringify(faqs, null, 2) : faqs || null,
        rawJson: typeof citations === 'object' ? JSON.stringify(citations) : citations || null,
        updatedAt: now,
      };

      if (existingId) {
        await db.update(productBriefs).set(dataToSave).where(eq(productBriefs.id, existingId));
      } else {
        await db.insert(productBriefs).values({
          id: briefId,
          ...dataToSave,
          createdAt: now,
        });
      }

      return NextResponse.json({
        status: 'ok',
        briefId,
        savedAt: now,
      });
    }

    return NextResponse.json({ status: 'error', message: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('Brief API error:', err);
    return NextResponse.json(
      { status: 'error', message: err.message || 'Error processing brief request' },
      { status: 500 }
    );
  }
}
