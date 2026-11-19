import { NextResponse } from 'next/server';
import { db, ensureDbInitialized } from '@/lib/db';
import { products, sources } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { ingestGitHubRepo } from '@/lib/ingestion/github';
import { extractWebDoc } from '@/lib/ingestion/webdocs';
import { extractDocumentContent } from '@/lib/ingestion/documents';

// Helper to ensure a product exists
async function getOrCreateDefaultProduct(customId?: string, name?: string) {
  await ensureDbInitialized();
  const targetId = customId || 'default-product';

  const [existing] = await db.select().from(products).where(eq(products.id, targetId)).limit(1);
  if (existing) return existing;

  const newProd = {
    id: targetId,
    workspaceId: 'default-workspace',
    name: name || 'SaaS Content Studio',
    description: 'Human-session AI content engine for ChatGPT, Gemini, and Google Flow.',
    repoUrl: 'https://github.com/Vpcodes11/Saas-Content-Studio',
    docsUrl: '',
    createdAt: Date.now(),
  };

  await db.insert(products).values(newProd);
  return newProd;
}

// GET /api/ingest - List products and ingested sources
export async function GET(request: Request) {
  try {
    await ensureDbInitialized();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId') || 'default-product';

    await getOrCreateDefaultProduct(productId);

    const allProducts = await db.select().from(products).orderBy(desc(products.createdAt));
    const productSources = await db
      .select()
      .from(sources)
      .where(eq(sources.productId, productId))
      .orderBy(desc(sources.createdAt));

    return NextResponse.json({
      status: 'ok',
      productId,
      products: allProducts,
      sources: productSources,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', message: err.message || 'Failed to fetch ingestion sources' },
      { status: 500 }
    );
  }
}

// POST /api/ingest - Ingest from GitHub, Web/Docs, Files, or Notes
export async function POST(request: Request) {
  try {
    await ensureDbInitialized();

    const contentType = request.headers.get('content-type') || '';

    // Handle Multipart Form Data (File Uploads)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const productId = (formData.get('productId') as string) || 'default-product';

      if (!file) {
        return NextResponse.json({ status: 'error', message: 'No file provided' }, { status: 400 });
      }

      await getOrCreateDefaultProduct(productId);

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const extracted = await extractDocumentContent(file.name, buffer);

      const sourceId = `src_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      await db.insert(sources).values({
        id: sourceId,
        productId,
        type: 'upload',
        title: file.name,
        content: extracted.textContent,
        metadata: JSON.stringify({
          fileType: extracted.fileType,
          fileSize: file.size,
          wordCount: extracted.wordCount,
        }),
        createdAt: Date.now(),
      });

      return NextResponse.json({
        status: 'ok',
        sourceId,
        title: file.name,
        type: 'upload',
        wordCount: extracted.wordCount,
      });
    }

    // Handle JSON Payloads
    const body = await request.json();
    const { action } = body;
    const productId = body.productId || 'default-product';
    await getOrCreateDefaultProduct(productId);

    // 1. GitHub Ingestion
    if (action === 'github') {
      const { repoUrl, token } = body;
      if (!repoUrl) {
        return NextResponse.json({ status: 'error', message: 'repoUrl is required' }, { status: 400 });
      }

      const ghResult = await ingestGitHubRepo(repoUrl, token);
      const sourceId = `src_gh_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      await db.insert(sources).values({
        id: sourceId,
        productId,
        type: 'github',
        title: `GitHub: ${ghResult.title}`,
        content: ghResult.combinedContent,
        metadata: JSON.stringify({
          owner: ghResult.owner,
          repo: ghResult.repo,
          stars: ghResult.stars,
          license: ghResult.license,
          fileCount: ghResult.fileTree.length,
          hasReadme: !!ghResult.readme,
          hasManifest: !!ghResult.manifest,
          hasChangelog: !!ghResult.changelog,
        }),
        createdAt: Date.now(),
      });

      return NextResponse.json({
        status: 'ok',
        sourceId,
        result: ghResult,
      });
    }

    // 2. Web / Docs URL Ingestion
    if (action === 'url') {
      const { url, maxPages = 1 } = body;
      if (!url) {
        return NextResponse.json({ status: 'error', message: 'url is required' }, { status: 400 });
      }

      const webResult = await extractWebDoc(url, Number(maxPages));
      const sourceId = `src_web_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      await db.insert(sources).values({
        id: sourceId,
        productId,
        type: 'url',
        title: `Docs: ${webResult.title}`,
        content: webResult.textContent,
        metadata: JSON.stringify({
          url: webResult.url,
          byline: webResult.byline,
          excerpt: webResult.excerpt,
          wordCount: webResult.wordCount,
          subPagesCount: webResult.crawledPages?.length || 0,
        }),
        createdAt: Date.now(),
      });

      return NextResponse.json({
        status: 'ok',
        sourceId,
        result: webResult,
      });
    }

    // 3. Manual Notes Ingestion
    if (action === 'note') {
      const { title, pricing, audience, usp, brandVoice, notes } = body;

      const formattedContent = [
        `# Product Strategy & Notes: ${title || 'General Notes'}`,
        pricing ? `## Pricing & Business Model\n${pricing}\n` : '',
        audience ? `## Target Audience & Personas\n${audience}\n` : '',
        usp ? `## Unique Selling Proposition (USP) & Moat\n${usp}\n` : '',
        brandVoice ? `## Brand Voice & Tone Guidelines\n${brandVoice}\n` : '',
        notes ? `## Additional Notes\n${notes}\n` : '',
      ]
        .filter(Boolean)
        .join('\n');

      const sourceId = `src_note_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      await db.insert(sources).values({
        id: sourceId,
        productId,
        type: 'note',
        title: title || 'Strategic Product Notes',
        content: formattedContent,
        metadata: JSON.stringify({
          hasPricing: !!pricing,
          hasAudience: !!audience,
          hasUsp: !!usp,
          hasBrandVoice: !!brandVoice,
        }),
        createdAt: Date.now(),
      });

      return NextResponse.json({
        status: 'ok',
        sourceId,
        formattedContent,
      });
    }

    // 4. Delete Source
    if (action === 'delete') {
      const { sourceId } = body;
      if (!sourceId) {
        return NextResponse.json({ status: 'error', message: 'sourceId is required' }, { status: 400 });
      }

      await db.delete(sources).where(eq(sources.id, sourceId));
      return NextResponse.json({ status: 'ok', deletedSourceId: sourceId });
    }

    // 5. Create or Update Product
    if (action === 'create_product') {
      const { name, description, repoUrl, docsUrl } = body;
      const newProdId = `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      await db.insert(products).values({
        id: newProdId,
        workspaceId: 'default-workspace',
        name: name || 'New SaaS Product',
        description: description || '',
        repoUrl: repoUrl || '',
        docsUrl: docsUrl || '',
        createdAt: Date.now(),
      });

      return NextResponse.json({ status: 'ok', product: { id: newProdId, name } });
    }

    return NextResponse.json({ status: 'error', message: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('Ingest API error:', err);
    return NextResponse.json(
      { status: 'error', message: err.message || 'Error processing ingestion request' },
      { status: 500 }
    );
  }
}
