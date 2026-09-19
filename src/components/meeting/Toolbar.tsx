"use client";

import { useState } from "react";

function ToolbarButton({
  active,
  danger,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  danger?: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-11 w-11 items-center justify-center rounded-sm border text-sm font-semibold transition-colors ${
        danger
          ? "border-danger bg-danger/15 text-danger hover:bg-danger/25"
          : active
            ? "border-teal/40 bg-panel-raised text-paper"
            : "border-line bg-panel text-dust hover:text-paper"
      }`}
    >
      {children}
    </button>
  );
}

const REACTIONS = ["👍", "👏", "❤️", "😂", "🎉"];

function ReactionsButton({
  handRaised,
  onSendReaction,
  onToggleHand,
}: {
  handRaised: boolean;
  onSendReaction: (emoji: string) => void;
  onToggleHand: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {open && (
        <div className="absolute bottom-full left-1/2 mb-2 flex -translate-x-1/2 items-center gap-1 rounded-md border border-line bg-panel-raised p-2 shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
          <button
            type="button"
            onClick={() => {
              onToggleHand();
              setOpen(false);
            }}
            aria-pressed={handRaised}
            title={handRaised ? "Baisser la main" : "Lever la main"}
            className={`flex h-9 w-9 items-center justify-center rounded-sm text-lg transition-colors ${
              handRaised ? "bg-amber" : "bg-console hover:bg-panel"
            }`}
          >
            ✋
          </button>
          <span className="mx-0.5 h-6 w-px bg-line" aria-hidden />
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onSendReaction(emoji);
                setOpen(false);
              }}
              title={emoji}
              className="flex h-9 w-9 items-center justify-center rounded-sm bg-console text-lg hover:bg-panel"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
      <ToolbarButton
        label="Réactions"
        active={open || handRaised}
        onClick={() => setOpen((v) => !v)}
      >
        {handRaised ? "✋" : "🙌"}
      </ToolbarButton>
    </div>
  );
}

export function Toolbar({
  micOn,
  camOn,
  sharing,
  chatOpen,
  participantsOpen,
  devicesOpen,
  handRaised,
  onToggleMic,
  onToggleCam,
  onToggleShare,
  onToggleChat,
  onToggleParticipants,
  onToggleDevices,
  onSendReaction,
  onToggleHand,
  onOpenLeaveConfirm,
}: {
  micOn: boolean;
  camOn: boolean;
  sharing: boolean;
  chatOpen: boolean;
  participantsOpen: boolean;
  devicesOpen: boolean;
  handRaised: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onToggleShare: () => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onToggleDevices: () => void;
  onSendReaction: (emoji: string) => void;
  onToggleHand: () => void;
  onOpenLeaveConfirm: () => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-line bg-panel px-4 py-3">
      <div aria-hidden />
      <div className="flex items-center gap-2">
        <ToolbarButton label={micOn ? "Couper le micro" : "Activer le micro"} active={micOn} onClick={onToggleMic}>
          {micOn ? "🎙️" : "🔇"}
        </ToolbarButton>
        <ToolbarButton label={camOn ? "Couper la caméra" : "Activer la caméra"} active={camOn} onClick={onToggleCam}>
          {camOn ? "📷" : "🚫"}
        </ToolbarButton>
        <ToolbarButton label={sharing ? "Arrêter le partage d'écran" : "Partager l'écran"} active={sharing} onClick={onToggleShare}>
          🖵
        </ToolbarButton>
        <ReactionsButton handRaised={handRaised} onSendReaction={onSendReaction} onToggleHand={onToggleHand} />
        <ToolbarButton label="Discussion" active={chatOpen} onClick={onToggleChat}>
          💬
        </ToolbarButton>
        <ToolbarButton label="Participants" active={participantsOpen} onClick={onToggleParticipants}>
          👥
        </ToolbarButton>
        <ToolbarButton label="Microphone, caméra et sortie audio" active={devicesOpen} onClick={onToggleDevices}>
          ⚙️
        </ToolbarButton>
      </div>
      <div className="flex justify-end">
        <ToolbarButton label="Quitter la réunion" danger onClick={onOpenLeaveConfirm}>
          ⏻
        </ToolbarButton>
      </div>
    </div>
  );
}
