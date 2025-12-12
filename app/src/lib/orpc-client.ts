import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { RouterClient } from '@orpc/server';

import type { AppRouter } from '@/server/router';

export type AppClient = RouterClient<AppRouter>;

export const orpcClient: AppClient = createORPCClient<AppClient>(
  new RPCLink({
    url: () => '/api/orpc',
  })
);
