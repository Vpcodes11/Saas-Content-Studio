import { NextResponse } from 'next/server';
import { db, ensureDbInitialized } from '@/lib/db';
import { generations, jobs, contentTemplates } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

// GET /api/library - List generations with optional search and favorite filter
export async function GET(request: Request) {
  try {
    await ensureDbInitialized();
    const { searchParams } = new URL(request.url);
    const favoriteOnly = searchParams.get('favorite') === 'true';
    const query = searchParams.get('q')?.toLowerCase() || '';

    const allGenerations = await db
      .select({
        id: generations.id,
        jobId: generations.jobId,
        productId: generations.productId,
        templateId: generations.templateId,
        title: generations.title,
        contentMarkdown: generations.contentMarkdown,
        mediaUrls: generations.mediaUrls,
        isFavorite: generations.isFavorite,
        createdAt: generations.createdAt,
        targetSite: jobs.targetSite,
        prompt: jobs.prompt,
      })
      .from(generations)
      .leftJoin(jobs, eq(generations.jobId, jobs.id))
      .orderBy(desc(generations.createdAt));

    let filtered = allGenerations;
    if (favoriteOnly) {
      filtered = filtered.filter(g => g.isFavorite === 1);
    }
    if (query) {
      filtered = filtered.filter(
        g => g.title.toLowerCase().includes(query) || g.contentMarkdown.toLowerCase().includes(query)
      );
    }

    return NextResponse.json({
      status: 'ok',
      total: filtered.length,
      generations: filtered,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', message: err.message || 'Failed fetching library' },
      { status: 500 }
    );
  }
}

// POST /api/library - Favorite, edit, or delete generation
export async function POST(request: Request) {
  try {
    await ensureDbInitialized();
    const body = await request.json();
    const { action, id } = body;

    if (!id) {
      return NextResponse.json({ status: 'error', message: 'Generation ID is required' }, { status: 400 });
    }

    if (action === 'toggle_favorite') {
      const [current] = await db.select().from(generations).where(eq(generations.id, id)).limit(1);
      if (!current) return NextResponse.json({ status: 'error', message: 'Item not found' }, { status: 404 });

      const newFav = current.isFavorite === 1 ? 0 : 1;
      await db.update(generations).set({ isFavorite: newFav }).where(eq(generations.id, id));
      return NextResponse.json({ status: 'ok', id, isFavorite: newFav });
    }

    if (action === 'update') {
      const { title, contentMarkdown } = body;
      await db
        .update(generations)
        .set({
          title: title || undefined,
          contentMarkdown: contentMarkdown || undefined,
        })
        .where(eq(generations.id, id));

      return NextResponse.json({ status: 'ok', id, updated: true });
    }

    if (action === 'delete') {
      await db.delete(generations).where(eq(generations.id, id));
      return NextResponse.json({ status: 'ok', deletedId: id });
    }

    return NextResponse.json({ status: 'error', message: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', message: err.message || 'Error processing library request' },
      { status: 500 }
    );
  }
}
