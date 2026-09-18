"use client";

import { useEffect, useRef } from "react";
import type { LocalVideoTrack, RemoteVideoTrack } from "livekit-client";

export function VideoSurface({
  track,
  mirrored,
}: {
  track?: LocalVideoTrack | RemoteVideoTrack;
  mirrored?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !track) return;
    track.attach(el);
    return () => {
      track.detach(el);
    };
  }, [track]);

  if (!track) {
    return <div className="flex h-full w-full items-center justify-center bg-console text-dust-dim">Caméra coupée</div>;
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={`h-full w-full object-cover ${mirrored ? "-scale-x-100" : ""}`}
    />
  );
}
