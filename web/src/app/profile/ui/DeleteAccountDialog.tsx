"use client";

import { useState, useTransition } from "react";
import { deleteAccountAction } from "../actions";

export default function DeleteAccountDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [confirmation, setConfirmation] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!open) return null;

  const confirmed = confirmation.trim().toUpperCase() === "DELETE";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="ura-card rounded-2xl p-6 w-full max-w-sm"
        role="dialog"
        aria-modal="true"
      >
        <div
          className="text-lg font-semibold"
          style={{ color: "var(--ura-text-primary)" }}
        >
          Delete your account?
        </div>

        <div
          className="mt-3 text-sm leading-relaxed"
          style={{ color: "var(--ura-text-secondary)" }}
        >
          This will permanently delete your profile, birth data, cached charts,
          sessions, and all associated data. This action cannot be undone.
        </div>

        <div className="mt-4">
          <label
            className="block text-xs font-medium mb-1.5"
            style={{ color: "var(--ura-text-secondary)" }}
          >
            Type <strong>DELETE</strong> to confirm
          </label>
          <input
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            className="ura-input w-full"
            placeholder="DELETE"
            autoFocus
          />
        </div>

        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className="ura-btn-secondary flex-1 py-2.5 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            disabled={!confirmed || isPending}
            onClick={() => {
              startTransition(() => {
                deleteAccountAction();
              });
            }}
            className="flex-1 py-2.5 text-sm font-medium rounded-xl disabled:opacity-40"
            style={{
              background: "rgba(181, 106, 77, 0.25)",
              border: "1px solid rgba(181, 106, 77, 0.4)",
              color: "var(--ura-alert)",
            }}
          >
            {isPending ? "Deleting..." : "Delete account"}
          </button>
        </div>
      </div>
    </div>
  );
}
