import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div
        className="text-6xl font-bold"
        style={{ color: "var(--ura-accent-primary)" }}
      >
        404
      </div>
      <h1
        className="text-xl font-semibold mt-4"
        style={{ color: "var(--ura-text-primary)" }}
      >
        Page not found
      </h1>
      <p
        className="text-sm mt-2 max-w-sm"
        style={{ color: "var(--ura-text-muted)" }}
      >
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-6 ura-btn-primary px-6 py-2.5 text-sm font-medium inline-block"
      >
        Return home
      </Link>
    </div>
  );
}
