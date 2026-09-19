"use client";

export function LeaveConfirmDialog({
  isHost,
  onCancel,
  onLeaveOnly,
  onEndForEveryone,
}: {
  isHost: boolean;
  onCancel: () => void;
  onLeaveOnly: () => void;
  onEndForEveryone: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-console/70 px-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="leave-dialog-title"
    >
      <div className="w-full max-w-sm rounded-md border border-line bg-panel p-5">
        <h2 id="leave-dialog-title" className="font-display text-xl font-bold text-paper">
          Quitter la réunion ?
        </h2>
        <p className="mt-2 text-sm text-dust">
          {isHost
            ? "Vous êtes l'hôte. Voulez-vous quitter seulement, ou terminer la réunion pour tout le monde ?"
            : "Vous êtes sur le point de quitter la réunion."}
        </p>

        <div className="mt-5 flex flex-col gap-2">
          {isHost ? (
            <>
              <button
                type="button"
                onClick={onEndForEveryone}
                className="w-full rounded-sm bg-danger px-4 py-2.5 text-sm font-semibold text-console transition-colors hover:opacity-90"
              >
                Terminer pour tout le monde
              </button>
              <button
                type="button"
                onClick={onLeaveOnly}
                className="w-full rounded-sm border border-line bg-console px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:border-teal/40"
              >
                Quitter seulement
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onLeaveOnly}
              className="w-full rounded-sm bg-danger px-4 py-2.5 text-sm font-semibold text-console transition-colors hover:opacity-90"
            >
              Quitter la réunion
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-sm px-4 py-2 text-sm text-dust hover:text-paper"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
