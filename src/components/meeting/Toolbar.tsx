"use client";

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

export function Toolbar({
  micOn,
  camOn,
  sharing,
  chatOpen,
  participantsOpen,
  devicesOpen,
  onToggleMic,
  onToggleCam,
  onToggleShare,
  onToggleChat,
  onToggleParticipants,
  onToggleDevices,
  onLeave,
}: {
  micOn: boolean;
  camOn: boolean;
  sharing: boolean;
  chatOpen: boolean;
  participantsOpen: boolean;
  devicesOpen: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onToggleShare: () => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onToggleDevices: () => void;
  onLeave: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2 border-t border-line bg-panel px-4 py-3">
      <ToolbarButton label={micOn ? "Couper le micro" : "Activer le micro"} active={micOn} onClick={onToggleMic}>
        {micOn ? "🎙️" : "🔇"}
      </ToolbarButton>
      <ToolbarButton label={camOn ? "Couper la caméra" : "Activer la caméra"} active={camOn} onClick={onToggleCam}>
        {camOn ? "📷" : "🚫"}
      </ToolbarButton>
      <ToolbarButton label={sharing ? "Arrêter le partage d'écran" : "Partager l'écran"} active={sharing} onClick={onToggleShare}>
        🖵
      </ToolbarButton>
      <ToolbarButton label="Discussion" active={chatOpen} onClick={onToggleChat}>
        💬
      </ToolbarButton>
      <ToolbarButton label="Participants" active={participantsOpen} onClick={onToggleParticipants}>
        👥
      </ToolbarButton>
      <ToolbarButton label="Microphone et caméra" active={devicesOpen} onClick={onToggleDevices}>
        ⚙️
      </ToolbarButton>
      <ToolbarButton label="Quitter la réunion" danger onClick={onLeave}>
        ⏻
      </ToolbarButton>
    </div>
  );
}
