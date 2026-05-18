import { NextResponse } from 'next/server';
import { MOCK_TIMELINE } from '@/lib/generateMockTimeline';

export async function GET() {
  try {
    // Simulate slight network latency for realism
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Return only the lightweight timeline (1000 items)
    return NextResponse.json(MOCK_TIMELINE);
  } catch (error) {
    console.error('API Error /api/timeline:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve timeline data' },
      { status: 500 }
    );
  }
}
