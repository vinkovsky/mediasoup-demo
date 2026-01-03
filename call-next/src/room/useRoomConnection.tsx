import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { RoomConnection, type RemoteTrack } from './RoomConnection';

export type UseRoomConnectionState = {
  state: 'idle' | 'connecting' | 'connected' | 'closed' | 'error';
  error?: unknown;
  localStream: MediaStream | null;
  remoteTracks: RemoteTrack[];
  serverMediasoupVersion?: string;
  micEnabled: boolean;
  webcamEnabled: boolean;
};

export function useRoomConnection({
  roomId,
  displayName,
  peerId,
}: {
  roomId: string;
  displayName: string;
  peerId: string;
}) {
  const [state, setState] = useState<UseRoomConnectionState['state']>('idle');
  const [error, setError] = useState<unknown>(undefined);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteTracks, setRemoteTracks] = useState<RemoteTrack[]>([]);
  const [serverMediasoupVersion, setServerMediasoupVersion] = useState<string | undefined>(
    undefined
  );
  const [micEnabled, setMicEnabled] = useState(false);
  const [webcamEnabled, setWebcamEnabled] = useState(false);

  const connRef = useRef<RoomConnection | null>(null);

  useEffect(() => {
    const conn = new RoomConnection({
      roomId,
      displayName,
      peerId,
      callbacks: {
        onState: (nextState, err) => {
          setState(nextState);
          if (err !== undefined) setError(err);
        },
        onLocalStream: stream => {
          setLocalStream(stream);
        },
        onRemoteTrackAdded: track => {
          setRemoteTracks(prev => [...prev.filter(t => t.id !== track.id), track]);
        },
        onRemoteTrackRemoved: trackId => {
          setRemoteTracks(prev => prev.filter(t => t.id !== trackId));
        },
        onServerMediasoupVersion: version => setServerMediasoupVersion(version),
      },
    });

    connRef.current = conn;
    void conn.join();

    return () => {
      conn.close();
      connRef.current = null;
    };
  }, [roomId, displayName, peerId]);

  const enableMic = useCallback(async () => {
    await connRef.current?.enableMic();
    setMicEnabled(true);
  }, []);

  const disableMic = useCallback(() => {
    connRef.current?.disableMic();
    setMicEnabled(false);
  }, []);

  const enableWebcam = useCallback(async () => {
    await connRef.current?.enableWebcam();
    setWebcamEnabled(true);
  }, []);

  const disableWebcam = useCallback(() => {
    connRef.current?.disableWebcam();
    setWebcamEnabled(false);
  }, []);

  const close = useCallback(() => {
    connRef.current?.close();
  }, []);

  const result: UseRoomConnectionState = useMemo(
    () => ({
      state,
      error,
      localStream,
      remoteTracks,
      serverMediasoupVersion,
      micEnabled,
      webcamEnabled,
    }),
    [state, error, localStream, remoteTracks, serverMediasoupVersion, micEnabled, webcamEnabled]
  );

  return {
    ...result,
    actions: {
      enableMic,
      disableMic,
      enableWebcam,
      disableWebcam,
      close,
    },
  };
}

