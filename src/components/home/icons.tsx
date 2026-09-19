// Glyphes dessinés à la main pour rester dans le vocabulaire visuel de la
// console de mixage — pas une bibliothèque d'icônes génériques. Trait
// uniforme (1.6), currentColor, viewBox 24x24.

function Base({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function FaderIcon() {
  return (
    <Base>
      <rect x="3.5" y="4" width="17" height="16" rx="2" opacity={0.35} />
      <line x1="9" y1="7" x2="9" y2="17" />
      <rect x="6.6" y="12.5" width="4.8" height="3" rx="0.8" fill="currentColor" stroke="none" />
      <line x1="15" y1="7" x2="15" y2="17" />
      <rect x="12.6" y="7.5" width="4.8" height="3" rx="0.8" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function WaveformIcon() {
  return (
    <Base>
      <line x1="4" y1="12" x2="4" y2="12" />
      <line x1="7" y1="8" x2="7" y2="16" />
      <line x1="10.3" y1="4.5" x2="10.3" y2="19.5" />
      <line x1="13.6" y1="9.5" x2="13.6" y2="14.5" />
      <line x1="16.9" y1="6.5" x2="16.9" y2="17.5" />
      <line x1="20" y1="10.5" x2="20" y2="13.5" />
    </Base>
  );
}

export function MicIcon() {
  return (
    <Base>
      <rect x="9.2" y="3.5" width="5.6" height="10" rx="2.8" />
      <path d="M6 11.5a6 6 0 0 0 12 0" />
      <line x1="12" y1="17.5" x2="12" y2="20.5" />
      <line x1="8.5" y1="20.5" x2="15.5" y2="20.5" />
    </Base>
  );
}

export function ClockIcon() {
  return (
    <Base>
      <circle cx="12" cy="12" r="8.5" />
      <line x1="12" y1="7.5" x2="12" y2="12" />
      <line x1="12" y1="12" x2="15.2" y2="14" />
    </Base>
  );
}

export function LockIcon() {
  return (
    <Base>
      <rect x="5.5" y="11" width="13" height="9" rx="1.8" />
      <path d="M8.2 11V8a3.8 3.8 0 0 1 7.6 0v3" />
      <line x1="12" y1="14.7" x2="12" y2="16.7" />
    </Base>
  );
}

export function HandIcon() {
  return (
    <Base>
      <path d="M9 12.5V5.2a1.4 1.4 0 0 1 2.8 0v5.8" />
      <path d="M11.8 11V4.4a1.4 1.4 0 0 1 2.8 0V11" />
      <path d="M14.6 11.2V6a1.4 1.4 0 0 1 2.8 0v9.5c0 3.3-2.2 5.5-5.6 5.5-2.4 0-3.7-.8-4.9-2.4L4.2 13.8a1.5 1.5 0 0 1 2.3-1.9L9 14.5" />
    </Base>
  );
}

export function LinkIcon() {
  return (
    <Base>
      <path d="M9.5 14.5 14.5 9.5" />
      <path d="M11 7.2 12.7 5.5a3.4 3.4 0 0 1 4.8 4.8l-1.7 1.7" />
      <path d="M13 16.8 11.3 18.5a3.4 3.4 0 0 1-4.8-4.8l1.7-1.7" />
    </Base>
  );
}

export function UserCheckIcon() {
  return (
    <Base>
      <circle cx="10" cy="8" r="3.2" />
      <path d="M4.5 19.5c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" />
      <path d="M16.5 11.5 18 13l3-3" />
    </Base>
  );
}

export function BrowserIcon() {
  return (
    <Base>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <line x1="3.5" y1="8.5" x2="20.5" y2="8.5" />
      <circle cx="6" cy="6.75" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="8" cy="6.75" r="0.5" fill="currentColor" stroke="none" />
    </Base>
  );
}
