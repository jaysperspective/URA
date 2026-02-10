import { SLIDES } from "./carouselData";
import AboutCarouselClient from "./AboutCarouselClient";

export default function AboutCarouselServer() {
  const firstSlide = SLIDES[0];

  return (
    <>
      {/* Preload first slide image for instant LCP */}
      <link rel="preload" href="/about-slides/slide-01.webp" as="image" />

      {/* Server-rendered first slide: visible before JS loads */}
      <div
        id="ssr-first-slide"
        className="fixed inset-0 flex flex-col overflow-hidden select-none"
        style={{ background: "var(--ura-bg-primary)" }}
      >
        {/* Background Image Layer */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/about-slides/slide-01.webp')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(8px)",
            transform: "scale(1.1)",
            opacity: 0.6,
          }}
        />

        {/* Gradient Overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(36, 62, 54, 0.3) 0%, rgba(36, 62, 54, 0.7) 100%)",
          }}
        />

        {/* Content */}
        <div
          className="relative flex-1 flex flex-col items-center justify-center px-6 py-8"
          style={{
            paddingTop: "calc(var(--safe-top, 0px) + 2rem)",
            paddingBottom: "calc(var(--safe-bottom, 0px) + 4rem)",
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl px-6 py-8"
            style={{
              background: "rgba(46, 74, 65, 0.75)",
              backdropFilter: "blur(16px)",
              border: "1px solid var(--ura-border-subtle)",
              boxShadow: "var(--ura-shadow-md)",
            }}
          >
            {firstSlide.title && (
              <div
                className="text-xs font-semibold uppercase tracking-widest text-center mb-2"
                style={{ color: "var(--ura-accent-primary)" }}
              >
                {firstSlide.title}
              </div>
            )}
            <h2
              className="text-xl font-semibold text-center leading-tight"
              style={{ color: "var(--ura-text-primary)" }}
            >
              {firstSlide.headline}
            </h2>
            <div className="mt-4 space-y-3">
              {firstSlide.body.map((line, i) => (
                <p
                  key={i}
                  className="text-sm text-center leading-relaxed"
                  style={{ color: "var(--ura-text-secondary)" }}
                >
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Client carousel hydrates on top, hiding the SSR shell */}
      <AboutCarouselClient />
    </>
  );
}
