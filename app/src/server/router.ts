import { os } from '@orpc/server';
import { z } from 'zod';

export const appRouter = os.router({
  hello: os
    .input(
      z.object({
        name: z.string().min(1).optional(),
      })
    )
    .output(
      z.object({
        greeting: z.string(),
        serverTime: z.string(),
      })
    )
    .handler(({ input }) => {
      const who = input.name ?? 'world';

      return {
        greeting: `Hello, ${who}!`,
        serverTime: new Date().toISOString(),
      };
    }),

  math: os.router({
    add: os
      .input(
        z.object({
          a: z.number(),
          b: z.number(),
        })
      )
      .output(
        z.object({
          sum: z.number(),
        })
      )
      .handler(({ input }) => ({ sum: input.a + input.b })),
  }),
});

export type AppRouter = typeof appRouter;
