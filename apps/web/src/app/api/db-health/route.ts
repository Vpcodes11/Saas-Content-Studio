import { NextResponse } from 'next/server';
import { db, ensureDbInitialized } from '@/lib/db';
import { workspaces } from '@/lib/db/schema';

export async function GET() {
  try {
    await ensureDbInitialized();
    const allWorkspaces = await db.select().from(workspaces);
    return NextResponse.json({
      status: 'ok',
      database: 'sqlite',
      workspaceCount: allWorkspaces.length,
      defaultWorkspace: allWorkspaces[0] || null,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: error.message || 'Failed to connect to database',
      },
      { status: 500 }
    );
  }
}
