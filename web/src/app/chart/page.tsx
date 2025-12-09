// web/src/app/chart/page.tsx

"use client";

import { useEffect, useState } from "react";
import { AstroWheel } from "@/components/astro/AstroWheel";
import { LinearZodiacBar } from "@/components/astro/LinearZodiacBar";

type ChartResponse = {
  ok: boolean;
  input?: any;
  data?: any;
  error?: string;
};

export default function ChartPage() {
  const [natalChartRes, setNatalChartRes] = useState<ChartResponse | null>(null);
  const [transitChartRes, setTransitChartRes] = useState<ChartResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCharts() {
      setLoading(true);
      try {
        const natalBody = {
          year: 1990,
          month: 1,
          day: 24,
          hour: 1,
          minute: 39,
          latitude: 36.585,
          longitude: -79.395,
        };

        const now = new Date();
        const transitBody = {
          year: now.getUTCFullYear(),
          month: now.getUTCMonth() + 1,
          day: now.getUTCDate(),
          hour: now.getUTCHours(),
          minute: now.getUTCMinutes(),
          latitude: 36.585, // same coords for now
          longitude: -79.395,
        };

        const [natalRes, transitRes] = await Promise.all([
          fetch("/api/chart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(natalBody),
          }),
          fetch("/api/chart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(transitBody),
          }),
        ]);

        const natalJson = await natalRes.json();
        const transitJson = await transitRes.json();

        setNatalChartRes(natalJson);
        setTransitChartRes(transitJson);
      } catch (e: any) {
        setNatalChartRes({ ok: false, error: e.message || "Failed to load chart" });
        setTransitChartRes({ ok: false, error: e.message || "Failed to load chart" });
      } finally {
        setLoading(false);
      }
    }

    loadCharts();
  }, []);

  const natalChart =
    natalChartRes?.ok && natalChartRes.data ? natalChartRes.data : null;
  const transitChart =
    transitChartRes?.ok && transitChartRes.data ? transitChartRes.data : null;

  // Map planets into arrays for the strip
  const natalPlanetsForStrip =
    natalChart && natalChart.planets
      ? Array.isArray(natalChart.planets)
        ? natalChart.planets
        : Object.entries(natalChart.planets).map(([name, p]: [string, any]) => ({
            name,
            longitude: p.longitude ?? p.lon ?? p.lng ?? 0,
          }))
      : [];

  const transitPlanetsForStrip =
    transitChart && transitChart.planets
      ? Array.isArray(transitChart.planets)
        ? transitChart.planets
        : Object.entries(transitChart.planets).map(
            ([name, p]: [string, any]) => ({
              name,
              longitude: p.longitude ?? p.lon ?? p.lng ?? 0,
            })
          )
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
        {/* WHEEL – natal chart */}
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

          {!loading && natalChart && <AstroWheel chart={natalChart} />}

          {!loading && !natalChart && (
            <div
              style={{
                color: "#FFB0B0",
                fontFamily: "system-ui, sans-serif",
                fontSize: 14,
              }}
            >
              Error: {natalChartRes?.error || "Unknown error"}
            </div>
          )}
        </div>

        {/* HORIZONTAL STRIP – natal (bottom) + transits (top) */}
        {natalChart && (
          <div>
            <LinearZodiacBar
              ascDeg={natalChart.ascendant}
              mcDeg={natalChart.mc}
              natalPlanets={natalPlanetsForStrip}
              transitPlanets={transitPlanetsForStrip}
            />
          </div>
        )}

        {/* INFO CARD UNDER EVERYTHING */}
        {natalChart && (
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
              The upper wheel shows your natal analog–cosmic chart. The strip in
              the middle unwraps the zodiac into a straight line: natal planets
              travel along the bottom, and today&apos;s sky moves along the top.
            </p>

            <div
              style={{
                fontSize: 13,
                lineHeight: 1.5,
                color: "#EDE3CC",
              }}
            >
              {typeof natalChart.julianDay === "number" && (
                <div style={{ marginBottom: 8 }}>
                  <strong>Natal Julian Day:</strong>{" "}
                  {natalChart.julianDay.toFixed(5)}
                </div>
              )}
              {typeof natalChart.ascendant === "number" && (
                <div style={{ marginBottom: 4 }}>
                  <strong>ASC:</strong> {natalChart.ascendant.toFixed(2)}°
                </div>
              )}
              {typeof natalChart.mc === "number" && (
                <div style={{ marginBottom: 4 }}>
                  <strong>MC:</strong> {natalChart.mc.toFixed(2)}°
                </div>
              )}

              {transitChart && typeof transitChart.julianDay === "number" && (
                <div style={{ marginTop: 10, opacity: 0.85 }}>
                  <strong>Today&apos;s Julian Day:</strong>{" "}
                  {transitChart.julianDay.toFixed(5)}
                </div>
              )}

              <div style={{ marginTop: 12, opacity: 0.8 }}>
                Next step is to add time controls (+1 day / +1 month) so you can
                scrub the top row forward and backward while the natal layer
                stays anchored.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
