import { NextResponse } from 'next/server';
import { db, ensureDbInitialized } from '@/lib/db';
import { productBriefs, products, jobs, generations } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

interface PipelineStage {
  id: string;
  name: string;
  targetSite: 'chatgpt' | 'gemini' | 'flow';
  prompt: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  mediaUrls?: string[];
}

interface PipelinePreset {
  id: string;
  title: string;
  description: string;
  stages: PipelineStage[];
}

const defaultPipelines: PipelinePreset[] = [
  {
    id: 'pipe_video_funnel',
    title: 'Brief → 30s Script → 4 Flow Scenes → Video Assembly',
    description: 'Chains ChatGPT (scriptwriting) → Gemini (visual decomposition) → Google Flow (AI video scene rendering).',
    stages: [
      {
        id: 'stage_1',
        name: 'Step 1: ChatGPT 30s High-Conversion Script',
        targetSite: 'chatgpt',
        prompt: `Based on {{productName}} ({{oneLiner}}), write a 30-second video commercial script.
The script must have 4 distinct visual beats:
Beat 1 (0-8s): The hook & painful token limits
Beat 2 (8-16s): Introducing real browser session orchestration
Beat 3 (16-24s): Dual ChatGPT & Gemini live comparison
Beat 4 (24-30s): Call to action: Try local engine free`,
        status: 'pending',
      },
      {
        id: 'stage_2',
        name: 'Step 2: Gemini Scene Prompt Decomposition',
        targetSite: 'gemini',
        prompt: `Convert the following 30s commercial script into 4 photographic Google Flow video generation prompts:
{{previousResult}}

For each scene, output:
- Scene Number & Duration
- Visual Camera Movement (e.g. slow cinematic dolly in, neon cyberpunk lighting, 4K Unreal Engine render)
- Exact prompt text for Google Flow`,
        status: 'pending',
      },
      {
        id: 'stage_3',
        name: 'Step 3: Google Flow Scene Video Rendering',
        targetSite: 'flow',
        prompt: `Cinematic 4K render of a modern developer terminal orchestrating real browser tabs, soft glowing blue and emerald lighting, high depth of field, 24fps motion.`,
        status: 'pending',
      },
    ],
  },
  {
    id: 'pipe_omnichannel_launch',
    title: 'Brief → Blog Post (ChatGPT) → Social Pack (Gemini)',
    description: 'Generates long-form technical essay on ChatGPT, then has Gemini adapt it into 7 X tweets and LinkedIn post.',
    stages: [
      {
        id: 'stage_1',
        name: 'Stage 1: Long-Form Technical Blog (ChatGPT)',
        targetSite: 'chatgpt',
        prompt: `Write a 1,200-word engineering deep dive for {{productName}} explaining how human-session browser automation replaces fragile API wrappers.`,
        status: 'pending',
      },
      {
        id: 'stage_2',
        name: 'Stage 2: Viral Social Distribution Pack (Gemini)',
        targetSite: 'gemini',
        prompt: `Read this engineering blog post and distill it into:
1. A 7-tweet viral X thread with punchy hooks
2. A high-signal LinkedIn founder post with double line spacing
Blog content:
{{previousResult}}`,
        status: 'pending',
      },
    ],
  },
];

// GET /api/pipelines - List available pipeline presets
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    pipelines: defaultPipelines,
  });
}

// POST /api/pipelines - Interpolate and prepare pipeline steps
export async function POST(request: Request) {
  try {
    await ensureDbInitialized();
    const body = await request.json();
    const { action, pipelineId = 'pipe_video_funnel', productId = 'default-product' } = body;

    const [brief] = await db
      .select()
      .from(productBriefs)
      .where(eq(productBriefs.productId, productId))
      .orderBy(desc(productBriefs.updatedAt))
      .limit(1);

    const [prod] = await db.select().from(products).where(eq(products.id, productId)).limit(1);

    const pipeline = defaultPipelines.find((p) => p.id === pipelineId) || defaultPipelines[0];

    if (action === 'prepare') {
      const preparedStages = pipeline.stages.map((stage) => {
        let p = stage.prompt;
        p = p.replaceAll('{{productName}}', prod?.name || 'SaaS Content Studio');
        p = p.replaceAll('{{oneLiner}}', brief?.oneLiner || 'Browser-session AI orchestrator');
        p = p.replaceAll('{{problem}}', brief?.problem || 'High API costs');
        p = p.replaceAll('{{features}}', brief?.features || 'Chrome extension, side-by-side arena');
        return {
          ...stage,
          prompt: p,
        };
      });

      return NextResponse.json({
        status: 'ok',
        pipeline: {
          ...pipeline,
          stages: preparedStages,
        },
      });
    }

    if (action === 'save_bundle') {
      const { title, stages } = body;
      const genId = `gen_pipe_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      const combinedMarkdown = (stages as PipelineStage[])
        .map((s, idx) => {
          return `## ${s.name}\n**Target:** ${s.targetSite.toUpperCase()}\n\n${s.result || 'No output'}\n\n---\n`;
        })
        .join('\n');

      const mediaUrls = (stages as PipelineStage[]).flatMap((s) => s.mediaUrls || []);

      await db.insert(generations).values({
        id: genId,
        productId,
        title: title || `Pipeline Output (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
        contentMarkdown: combinedMarkdown,
        mediaUrls: mediaUrls.length ? JSON.stringify(mediaUrls) : null,
        isFavorite: 1,
        createdAt: Date.now(),
      });

      return NextResponse.json({ status: 'ok', generationId: genId });
    }

    return NextResponse.json({ status: 'error', message: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', message: err.message || 'Error processing pipeline request' },
      { status: 500 }
    );
  }
}
