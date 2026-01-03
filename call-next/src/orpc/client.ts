import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { ContractRouterClient, inferRPCMethodFromContractRouter } from '@orpc/contract';
import { contract } from './contract';

export type ORPCClient = ContractRouterClient<typeof contract>;

const link = new RPCLink({
  url: '/orpc',
  method: inferRPCMethodFromContractRouter(contract),
});

export const orpc = createORPCClient<ORPCClient>(link);

