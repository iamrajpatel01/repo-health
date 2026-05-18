import type { TimelineCommit, CommitDetails } from "@/types/repo";

/**
 * Fetch the lightweight timeline dataset.
 */
export async function fetchTimeline(): Promise<TimelineCommit[]> {
  const res = await fetch('/api/timeline', {
    // Next.js specific fetch options if needed, but standard fetch works well client-side
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Timeline fetch failed: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Fetch heavy details for a specific commit.
 */
export async function fetchCommitDetails(hash: string): Promise<CommitDetails> {
  const res = await fetch(`/api/commit/${hash}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Not Found');
    }
    throw new Error(`Commit fetch failed: ${res.statusText}`);
  }

  return res.json();
}
