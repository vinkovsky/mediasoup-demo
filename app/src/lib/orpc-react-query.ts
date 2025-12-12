import { createRouterUtils } from '@orpc/react-query';

import { orpcClient } from './orpc-client';

export const orpc = createRouterUtils(orpcClient);
