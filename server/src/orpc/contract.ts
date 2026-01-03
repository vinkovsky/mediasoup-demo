import { oc, type as t } from '@orpc/contract';

/**
 * Contract shared (by convention) with the Next.js call app.
 *
 * NOTE: We keep it duplicated in `call-next/` to avoid turning this repo into a
 * monorepo/workspace for now.
 */
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
