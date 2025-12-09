"use client";

import { useEffect, useState } from "react";
import { AstroWheel } from "@/components/astro/AstroWheel";

type ChartResponse = {
  ok: boolean;
  input?: any;
  data?: any;
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
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
          gap: 24,
        }}
      >
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

          {!loading && chartRes?.ok && chartRes.data && (
            <AstroWheel chart={chartRes.data} />
          )}

          {!loading && !chartRes?.ok && (
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

        {/* Side panel – can become interpretation / controls later */}
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
            This is the first pass of the URA analog–cosmic wheel. The diagram
            is driven by live data from the <code>/api/chart</code> engine and
            is built in SVG so it can migrate cleanly to mobile.
          </p>

          {chartRes?.ok && chartRes.data && (
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.5,
                color: "#EDE3CC",
              }}
            >
              <div style={{ marginBottom: 8 }}>
                <strong>Julian Day:</strong> {chartRes.data.julianDay.toFixed(5)}
              </div>
              <div style={{ marginBottom: 4 }}>
                <strong>ASC:</strong> {chartRes.data.ascendant.toFixed(2)}°
              </div>
              <div style={{ marginBottom: 4 }}>
                <strong>MC:</strong> {chartRes.data.mc.toFixed(2)}°
              </div>
              <div style={{ marginTop: 12, opacity: 0.8 }}>
                Houses are rendered as carved spokes, and the Sun / Moon appear
                as luminous gems on the orbital track.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
