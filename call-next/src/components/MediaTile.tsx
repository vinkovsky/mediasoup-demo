import { useEffect, useRef } from 'react';

export function MediaTile({
  label,
  kind,
  stream,
  muted,
}: {
  label: string;
  kind: 'audio' | 'video';
  stream: MediaStream | null;
  muted?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (kind === 'video' && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    if (kind === 'audio' && audioRef.current) {
      audioRef.current.srcObject = stream;
    }
  }, [kind, stream]);

  return (
    <div className="videoCard">
      <div className="videoHeader">
        <div>{label}</div>
        <div>{stream ? `${stream.getTracks().length} tracks` : 'no media'}</div>
      </div>
      {kind === 'video' ? (
        <video ref={videoRef} muted={muted} autoPlay playsInline />
      ) : (
        <div style={{ padding: 12 }}>
          <audio ref={audioRef} muted={muted} autoPlay />
          <div className="hint" style={{ marginTop: 8 }}>
            Audio is playing (if allowed by browser autoplay policy).
          </div>
        </div>
      )}
    </div>
  );
}

