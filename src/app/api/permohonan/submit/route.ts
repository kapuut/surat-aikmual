export const runtime = 'nodejs';

import { POST as handlePermohonanPost } from '../route';

export async function POST(request: Request) {
  // Delegate directly to the main endpoint handler to avoid internal fetch failures.
  return handlePermohonanPost(request);
}
