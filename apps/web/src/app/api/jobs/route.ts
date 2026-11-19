import { NextResponse } from 'next/server';
import { db, ensureDbInitialized } from '@/lib/db';
import { jobs, generations } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

// GET /api/jobs - List recent jobs and their generations
export async function GET() {
  try {
    await ensureDbInitialized();
    const recentJobs = await db.select().from(jobs).orderBy(desc(jobs.createdAt)).limit(20);
    const recentGenerations = await db.select().from(generations).orderBy(desc(generations.createdAt)).limit(20);

    return NextResponse.json({
      status: 'ok',
      jobs: recentJobs,
      generations: recentGenerations,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: error.message || 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

// POST /api/jobs - Create or update a job in SQLite
export async function POST(request: Request) {
  try {
    await ensureDbInitialized();
    const body = await request.json();
    const { action } = body;

    if (action === 'create') {
      const { targetSite = 'chatgpt', prompt, productId } = body;
      const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      await db.insert(jobs).values({
        id: jobId,
        workspaceId: 'default-workspace',
        targetSite,
        status: 'running',
        prompt: prompt || 'Say hello',
        createdAt: Date.now(),
      });

      return NextResponse.json({
        status: 'ok',
        jobId,
        job: { id: jobId, targetSite, prompt, status: 'running' },
      });
    }

    if (action === 'complete') {
      const { jobId, status: jobStatus, resultMarkdown, error, title } = body;

      if (!jobId) {
        return NextResponse.json({ status: 'error', message: 'jobId is required' }, { status: 400 });
      }

      await db
        .update(jobs)
        .set({
          status: jobStatus,
          resultMarkdown: resultMarkdown || null,
          error: error || null,
          completedAt: Date.now(),
        })
        .where(eq(jobs.id, jobId));

      let genId = null;
      if (jobStatus === 'completed' && resultMarkdown) {
        const [jobRecord] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
        const modelLabel = jobRecord?.targetSite === 'gemini' 
          ? 'Gemini' 
          : jobRecord?.targetSite === 'flow' 
          ? 'Google Flow' 
          : 'ChatGPT';

        genId = `gen_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        await db.insert(generations).values({
          id: genId,
          jobId,
          title: title || `${modelLabel} Response (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
          contentMarkdown: resultMarkdown,
          createdAt: Date.now(),
        });
      }

      return NextResponse.json({
        status: 'ok',
        jobId,
        generationId: genId,
        savedToDb: true,
      });
    }

    if (action === 'favorite') {
      const { generationId, isFavorite = 1 } = body;
      if (!generationId) {
        return NextResponse.json({ status: 'error', message: 'generationId is required' }, { status: 400 });
      }

      await db
        .update(generations)
        .set({ isFavorite: Number(isFavorite) })
        .where(eq(generations.id, generationId));

      return NextResponse.json({
        status: 'ok',
        generationId,
        isFavorite,
      });
    }

    return NextResponse.json({ status: 'error', message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: error.message || 'Database error processing job' },
      { status: 500 }
    );
  }
}
