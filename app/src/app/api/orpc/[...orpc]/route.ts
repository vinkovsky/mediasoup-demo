import { RPCHandler } from '@orpc/server/fetch';

import { appRouter } from '@/server/router';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const handler = new RPCHandler(appRouter);

async function handle(request: Request): Promise<Response> {
  const result = await handler.handle(request);

  if (!result.matched) {
    return new Response('Not Found', { status: 404 });
  }

  return result.response;
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
