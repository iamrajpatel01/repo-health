import { NextResponse } from 'next/server';
import { MOCK_COMMIT_DETAILS } from '@/data/mockCommitDetails';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const { hash } = await params;

    // Simulate network latency for hydration effect
    await new Promise(resolve => setTimeout(resolve, 400));

    const details = MOCK_COMMIT_DETAILS[hash];

    if (!details) {
      // If not an anomaly commit, we simulate returning a stable graph structure 
      // rather than 404, so the dashboard always has valid data.
      // But for Phase 4 mock, we'll return the nearest anomaly or empty.
      return NextResponse.json(
        { error: `Commit details not found for hash: ${hash}` },
        { status: 404 }
      );
    }

    return NextResponse.json(details);
  } catch (error) {
    console.error('API Error /api/commit/[hash]:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve commit details' },
      { status: 500 }
    );
  }
}
