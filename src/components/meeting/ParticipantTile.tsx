"use client";

import type { TileState } from "@/lib/livekit/useMeetingRoom";
import { VideoSurface } from "@/components/meeting/VideoSurface";
import { Fader } from "@/components/mixer/Fader";
import { LiveLevelMeter } from "@/components/meeting/LiveLevelMeter";

export function ParticipantTile({
  tile,
  getLevel,
  onVolumeChange,
  onToggleMute,
  wide,
  isSpeaking,
}: {
  tile: TileState;
  getLevel: (identity: string) => number;
  onVolumeChange: (identity: string, percent: number) => void;
  onToggleMute: (identity: string) => void;
  wide?: boolean;
  isSpeaking?: boolean;
}) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-md border bg-panel transition-shadow ${
        isSpeaking ? "border-teal/70 shadow-[0_0_0_2px_rgba(79,199,181,0.35)]" : "border-line"
      } ${wide ? "col-span-full" : ""}`}
    >
      <div className="relative aspect-video w-full bg-console">
        <VideoSurface track={tile.videoTrack} mirrored={tile.isLocal && !tile.isScreenShare} />
        <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-sm bg-console/70 px-2 py-1 font-mono text-[11px] text-paper backdrop-blur-sm">
          <span className={`h-1.5 w-1.5 rounded-full ${tile.micEnabled ? "bg-teal" : "bg-danger"}`} />
          {tile.name.split("#")[0]}
          {tile.isLocal && " (vous)"}
        </div>
        {!tile.camEnabled && tile.avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- avatar hébergé sur Supabase Storage, pas dans le domaine optimisé par next/image
          <img
            src={tile.avatarUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        {!tile.camEnabled && !tile.avatarUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-console text-4xl font-display text-dust-dim">
            {tile.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        {tile.handRaised && (
          <div
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-amber text-base shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
            title={`${tile.name.split("#")[0]} a levé la main`}
          >
            ✋
          </div>
        )}
        {tile.reaction && (
          <div
            key={tile.reaction.id}
            className="reaction-pop pointer-events-none absolute bottom-2 right-2 text-3xl"
          >
            {tile.reaction.emoji}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-line px-3 py-2">
        {tile.isLocal ? (
          <span className="font-mono text-[11px] text-dust-dim">
            Réglez le volume des autres depuis leur vignette
          </span>
        ) : (
          <>
            <LiveLevelMeter getLevel={() => getLevel(tile.identity)} />
            <div className="flex-1">
              <Fader
                label={tile.name}
                percent={tile.volumePercent}
                muted={tile.muted}
                onChange={(p) => onVolumeChange(tile.identity, p)}
                onToggleMute={() => onToggleMute(tile.identity)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
