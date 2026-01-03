import process from 'node:process';
import crypto from 'node:crypto';

import mediasoup from 'mediasoup';
import { implement } from '@orpc/server';

import { contract } from './contract';

const impl = implement(contract);

export const orpcRouter = {
	info: impl.info.handler(() => {
		return {
			ok: true,
			serverTime: new Date().toISOString(),
			node: process.version,
			mediasoup: mediasoup.version,
		};
	}),

	room: {
		randomId: impl.room.randomId.handler(() => {
			return { roomId: crypto.randomUUID() };
		}),
	},
};
