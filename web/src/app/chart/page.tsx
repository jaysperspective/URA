// web/src/app/chart/page.tsx

"use client";

import { useEffect, useState } from "react";
import { AstroWheel } from "@/components/astro/AstroWheel";
import { LinearZodiacBar } from "@/components/astro/LinearZodiacBar";

type ChartResponse = {
  ok: boolean;
  input?: any;
  data?: any; // whatever /api/chart returns after flattening
  error?: string;
};

export default function ChartPage() {
  const [chartRes, setChartRes] = useState<ChartResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChart() {
      setLoading(true);
      try {
        const res = await fetch("/api/chart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            year: 1990,
            month: 1,
            day: 24,
            hour: 1,
            minute: 39,
            latitude: 36.585,
            longitude: -79.395,
          }),
        });

        const json = await res.json();
        setChartRes(json);
      } catch (e: any) {
        setChartRes({ ok: false, error: e.message || "Failed to load chart" });
      } finally {
        setLoading(false);
      }
    }

    loadChart();
  }, []);

  const chart = chartRes?.ok && chartRes.data ? chartRes.data : null;

  // Map whatever shape `chart.planets` has into an array for the strip
  const natalPlanetsForStrip =
    chart && chart.planets
      ? Array.isArray(chart.planets)
        ? chart.planets
        : Object.entries(chart.planets).map(([name, p]: [string, any]) => ({
            name,
            longitude: p.longitude ?? p.lon ?? p.lng ?? 0,
          }))
      : [];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#1B1F24",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px 12px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 960,
          display: "flex",
          flexDirection: "column",
          gap: 32,
        }}
      >
        {/* WHEEL */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          {loading && (
            <div
              style={{
                color: "#EDE3CC",
                fontFamily: "system-ui, sans-serif",
                fontSize: 14,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              Calculating chart…
            </div>
          )}

          {!loading && chart && <AstroWheel chart={chart} />}

          {!loading && !chart && (
            <div
              style={{
                color: "#FFB0B0",
                fontFamily: "system-ui, sans-serif",
                fontSize: 14,
              }}
            >
              Error: {chartRes?.error || "Unknown error"}
            </div>
          )}
        </div>

        {/* HORIZONTAL STRIP */}
        {chart && (
          <div>
            <LinearZodiacBar
              ascDeg={chart.ascendant}
              mcDeg={chart.mc}
              natalPlanets={natalPlanetsForStrip}
              // transitPlanets will be wired when we add a live transit fetch
            />
          </div>
        )}

        {/* INFO CARD UNDER EVERYTHING */}
        {chart && (
          <div
            style={{
              background: "#243039",
              borderRadius: 20,
              padding: 20,
              boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
              color: "#F1E9D2",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            <h1
              style={{
                margin: 0,
                marginBottom: 8,
                fontSize: 22,
                letterSpacing: 1,
              }}
            >
              Natal Chart Prototype
            </h1>
            <p
              style={{
                marginTop: 4,
                marginBottom: 16,
                fontSize: 14,
                color: "#D4C9B2",
              }}
            >
              The upper wheel shows the analog–cosmic chart. The strip in the
              middle unwraps the zodiac into a straight line so you can track
              planets across seasons and angles, all aligned to your Ascendant.
            </p>

            <div
              style={{
                fontSize: 13,
                lineHeight: 1.5,
                color: "#EDE3CC",
              }}
            >
              {typeof chart.julianDay === "number" && (
                <div style={{ marginBottom: 8 }}>
                  <strong>Julian Day:</strong> {chart.julianDay.toFixed(5)}
                </div>
              )}
              {typeof chart.ascendant === "number" && (
                <div style={{ marginBottom: 4 }}>
                  <strong>ASC:</strong> {chart.ascendant.toFixed(2)}°
                </div>
              )}
              {typeof chart.mc === "number" && (
                <div style={{ marginBottom: 4 }}>
                  <strong>MC:</strong> {chart.mc.toFixed(2)}°
                </div>
              )}
              <div style={{ marginTop: 12, opacity: 0.8 }}>
                Next step is to add today&apos;s transits as a second row on
                the strip, wire +1 day / +1 month controls, and have both the
                wheel and bar animate together.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
