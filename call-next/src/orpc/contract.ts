import { oc, type as t } from '@orpc/contract';

export const contract = oc.router({
  info: oc
    .input(t<Record<string, never>>())
    .output(
      t<{
        ok: true;
        serverTime: string;
        node: string;
        mediasoup: string;
      }>()
    )
    .route({ method: 'GET', path: '/orpc/info' }),

  room: oc.router({
    randomId: oc
      .input(t<Record<string, never>>())
      .output(t<{ roomId: string }>())
      .route({ method: 'GET', path: '/orpc/room/randomId' }),
  }),
});

export type Contract = typeof contract;

