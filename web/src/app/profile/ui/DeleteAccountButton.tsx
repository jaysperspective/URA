"use client";

import { useState } from "react";
import DeleteAccountDialog from "./DeleteAccountDialog";

export default function DeleteAccountButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Delete account">
        <span
          className="text-sm px-3 py-1.5 rounded-xl"
          style={{
            background: "rgba(181, 106, 77, 0.15)",
            border: "1px solid rgba(181, 106, 77, 0.3)",
            color: "var(--ura-alert)",
          }}
        >
          Delete Account
        </span>
      </button>
      <DeleteAccountDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
