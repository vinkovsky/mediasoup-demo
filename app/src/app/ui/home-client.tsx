'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { orpc } from '@/lib/orpc-react-query';

export function HomeClient() {
  const [name, setName] = useState('world');

  const helloInput = useMemo(() => ({ name }), [name]);

  const hello = useQuery(
    orpc.hello.queryOptions({
      input: helloInput,
    })
  );

  const add = useMutation(
    orpc.math.add.mutationOptions({
      onError: (err) => {
        // eslint-disable-next-line no-console
        console.error(err);
      },
    })
  );

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Next.js + oRPC + TanStack Query</h1>
        <p className="text-sm text-zinc-300">
          This page calls a typed oRPC endpoint via a TanStack Query integration.
        </p>
      </header>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1">
            <div className="mb-1 text-xs text-zinc-400">Name</div>
            <input
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <button
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-60"
            onClick={() => hello.refetch()}
            disabled={hello.isFetching}
          >
            Refetch
          </button>
        </div>

        <div className="mt-4 text-sm">
          {hello.isLoading ? (
            <div className="text-zinc-400">Loading…</div>
          ) : hello.isError ? (
            <div className="text-red-300">Error loading hello()</div>
          ) : !hello.data ? (
            <div className="text-zinc-500">No data.</div>
          ) : (
            <div className="space-y-1">
              <div>
                <span className="text-zinc-400">Greeting:</span> {hello.data.greeting}
              </div>
              <div>
                <span className="text-zinc-400">Server time:</span> {hello.data.serverTime}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-medium">math.add mutation</div>
            <div className="text-xs text-zinc-400">Calls oRPC mutation with input validation.</div>
          </div>

          <button
            className="rounded-md border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm disabled:opacity-60"
            onClick={() => add.mutate({ a: 2, b: 40 })}
            disabled={add.isPending}
          >
            {add.isPending ? 'Working…' : '2 + 40'}
          </button>
        </div>

        <div className="mt-3 text-sm">
          {add.data ? (
            <div>
              <span className="text-zinc-400">Result:</span> {add.data.sum}
            </div>
          ) : (
            <div className="text-zinc-500">Run the mutation to see a result.</div>
          )}
        </div>
      </section>

      <footer className="text-xs text-zinc-500">
        Endpoint base: <code className="rounded bg-zinc-900 px-1 py-0.5">/api/orpc</code>
      </footer>
    </div>
  );
}
