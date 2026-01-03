import { useEffect, useRef } from 'react';

export function VideoTile({
  label,
  stream,
  muted,
}: {
  label: string;
  stream: MediaStream | null;
  muted?: boolean;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.srcObject = stream;
  }, [stream]);

  return (
    <div className="videoCard">
      <div className="videoHeader">
        <div>{label}</div>
        <div>{stream ? `${stream.getTracks().length} tracks` : 'no media'}</div>
      </div>
      <video ref={ref} muted={muted} autoPlay playsInline />
    </div>
  );
}

