'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';

import { orpc } from '../src/orpc/client';

export default function HomePage() {
  const router = useRouter();
  const [roomId, setRoomId] = useState('');
  const [displayName, setDisplayName] = useState('Guest');

  const { data: info, error: infoError } = useSWR('orpc.info', () => orpc.info({}));
  const { data: randomRoom, isLoading: randomLoading } = useSWR('orpc.room.randomId', () =>
    orpc.room.randomId({})
  );

  const status = useMemo(() => {
    if (infoError) return { ok: false, text: 'server not reachable' };
    if (!info) return { ok: false, text: 'checking server…' };
    return { ok: true, text: `server ok (mediasoup ${info.mediasoup})` };
  }, [info, infoError]);

  return (
    <div className="grid">
      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Join a room</h2>

        <div style={{ marginBottom: 12 }}>
          <label>Room ID</label>
          <input
            value={roomId}
            onChange={e => setRoomId(e.target.value)}
            placeholder={randomRoom?.roomId ?? (randomLoading ? 'generating…' : 'room')}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Display name</label>
          <input value={displayName} onChange={e => setDisplayName(e.target.value)} />
        </div>

        <div className="row">
          <button
            onClick={() => {
              const finalRoomId = (roomId || randomRoom?.roomId || '').trim();
              if (!finalRoomId) return;
              router.push(
                `/room?roomId=${encodeURIComponent(finalRoomId)}&name=${encodeURIComponent(displayName)}`
              );
            }}
          >
            Join
          </button>

          <button className="secondary" onClick={() => setRoomId(randomRoom?.roomId ?? '')}>
            Use random room
          </button>
        </div>

        <p className="hint" style={{ marginBottom: 0, marginTop: 12 }}>
          This is a minimal call UI that connects to the existing mediasoup-demo server via Protoo WS.
          oRPC is used for typed “utility” APIs (server info, room id generation), and SWR caches those
          calls client-side.
        </p>
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Server status</h2>
        <div className="status">
          <span className={`dot ${status.ok ? 'ok' : 'bad'}`} />
          <span>{status.text}</span>
        </div>

        {info ? (
          <div style={{ marginTop: 12 }} className="hint">
            <div>
              <strong>Time:</strong> {info.serverTime}
            </div>
            <div>
              <strong>Node:</strong> {info.node}
            </div>
            <div>
              <strong>mediasoup:</strong> {info.mediasoup}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

