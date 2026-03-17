import { handlePermohonanPost } from '../route';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  return handlePermohonanPost(request);
}
