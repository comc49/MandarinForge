import { z } from 'zod';
import { critiqueMnemonic } from '../../_lib/ai/gemini';

interface Env {
  GEMINI_API_KEY: string;
}

interface PagesFunctionContext {
  request: Request;
  env: Env;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'http://localhost:4200',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const critiqueBodySchema = z.object({
  hanzi: z.string().min(1),
  pinyin: z.string().min(1),
  tone: z.number().int().min(1).max(5),
  englishMeaning: z.string().min(1),
  radicalComponents: z.array(z.string()).min(1),
  userMnemonic: z.string().min(1),
  tonePegObject: z.string().min(1),
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

export async function onRequestPost(context: PagesFunctionContext): Promise<Response> {
  const apiKey = context.env.GEMINI_API_KEY;
  if (!apiKey) {
    return json({ error: 'GEMINI_API_KEY is not configured' }, 500);
  }

  let rawBody: unknown;
  try {
    rawBody = await context.request.json();
  } catch {
    return json({ error: 'Request body must be valid JSON' }, 400);
  }

  const parsed = critiqueBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return json({ error: 'Invalid request', details: parsed.error.flatten() }, 400);
  }

  try {
    const result = await critiqueMnemonic(parsed.data, apiKey);
    return json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const isRateLimit =
      message.includes('rate limit') || message.includes('RESOURCE_EXHAUSTED');
    return json({ error: message }, isRateLimit ? 429 : 500);
  }
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
