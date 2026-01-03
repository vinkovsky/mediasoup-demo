'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';

import { MediaTile } from '../../src/components/MediaTile';
import { useRoomConnection } from '../../src/room/useRoomConnection';

function randomPeerId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `peer-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

export default function RoomPage() {
  return (
    <Suspense
      fallback={
        <div className="panel">
          <div style={{ fontSize: 18, fontWeight: 700 }}>Loading…</div>
          <p className="hint">Preparing room UI.</p>
        </div>
      }
    >
      <RoomPageInner />
    </Suspense>
  );
}

function RoomPageInner() {
  const searchParams = useSearchParams();

  const roomId = searchParams.get('roomId') || '';
  const displayName = searchParams.get('name') || 'Guest';

  const [peerId] = useState(() => randomPeerId());

  const conn = useRoomConnection({ roomId, displayName, peerId });
  const remote = useMemo(() => conn.remoteTracks, [conn.remoteTracks]);

  if (!roomId) {
    return (
      <div className="panel">
        <div style={{ fontSize: 18, fontWeight: 700 }}>Missing roomId</div>
        <p className="hint">Go back to the homepage and join a room.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Room: {roomId}</div>
          <div className="hint">
            You are <strong>{displayName}</strong> · peerId <code>{peerId}</code>
          </div>
        </div>

        <div className="status">
          <span
            className={`dot ${
              conn.state === 'connected' ? 'ok' : conn.state === 'error' ? 'bad' : ''
            }`}
          />
          <span>
            {conn.state}
            {conn.serverMediasoupVersion ? ` · server mediasoup ${conn.serverMediasoupVersion}` : ''}
          </span>
        </div>
      </div>

      {conn.error ? (
        <div className="hint" style={{ marginTop: 10, color: 'var(--danger)' }}>
          {String(conn.error)}
        </div>
      ) : null}

      <div className="row" style={{ marginTop: 12 }}>
        {!conn.micEnabled ? (
          <button onClick={() => void conn.actions.enableMic()}>Enable mic</button>
        ) : (
          <button className="secondary" onClick={() => conn.actions.disableMic()}>
            Disable mic
          </button>
        )}

        {!conn.webcamEnabled ? (
          <button onClick={() => void conn.actions.enableWebcam()}>Enable webcam</button>
        ) : (
          <button className="secondary" onClick={() => conn.actions.disableWebcam()}>
            Disable webcam
          </button>
        )}

        <button className="danger" onClick={() => conn.actions.close()}>
          Leave
        </button>
      </div>

      <div className="videoGrid" style={{ marginTop: 14 }}>
        <MediaTile label="Local" kind="video" stream={conn.localStream} muted />
        {remote.map(t => (
          <MediaTile key={t.id} label={t.label} kind={t.kind} stream={t.stream} />
        ))}
      </div>
    </div>
  );
}

