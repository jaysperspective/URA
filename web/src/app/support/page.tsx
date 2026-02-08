// src/app/support/page.tsx

import Link from "next/link";

export default function SupportPage() {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <div className="mb-5">
          <div className="ura-section-label">URA</div>
          <div className="ura-page-title mt-1">Support</div>
        </div>

        <div className="ura-card p-6 md:p-7 space-y-4">
          <div className="text-sm leading-relaxed ura-text-secondary">
            Have a question, issue, or feedback? Reach out directly and
            we&apos;ll get back to you as soon as possible.
          </div>

          <a
            href="mailto:joshualharrington@gmail.com?subject=URA Support Request"
            className="ura-btn-primary inline-block px-6 py-3 text-sm font-medium text-center"
          >
            Send an email
          </a>

          <div className="text-xs ura-text-muted">
            joshualharrington@gmail.com
          </div>
        </div>

        <div className="text-center pb-8">
          <Link
            href="/about"
            className="text-xs"
            style={{ color: "var(--ura-text-muted)" }}
          >
            Back to About
          </Link>
        </div>
      </div>
    </div>
  );
}
