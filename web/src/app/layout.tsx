// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TelemetryClient from "@/components/TelemetryClient";
import BottomNav from "@/components/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "URA",
  description: "URA",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Helps prevent annoying zoom/scale behavior on iOS while keeping usability sane.
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-dvh overflow-x-hidden`}
        style={{
          background: "var(--ura-bg-primary)",
        }}
      >
        {/* Client-only telemetry (pageviews + lastSeen ping) */}
        <TelemetryClient />

        {/* Global shell with moonlight gradient overlay */}
        <div
          className="min-h-dvh w-full overflow-x-hidden"
          style={{
            background: "var(--ura-gradient-page)",
          }}
        >
          <div className="mx-auto w-full max-w-screen-lg px-4 sm:px-6 lg:px-8 pt-safe pb-safe">
            {/* Extra bottom padding to account for fixed bottom nav */}
            <div className="pb-20">
              {children}
            </div>
          </div>
        </div>

        {/* Fixed bottom navigation */}
        <BottomNav />
      </body>
    </html>
  );
}
