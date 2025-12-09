// src/app/chart/page.tsx

"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { AstroWheel } from "@/components/astro/AstroWheel";
import { LinearZodiacBar } from "@/components/astro/LinearZodiacBar";

type ChartResponse = {
  ok: boolean;
  input?: any;
  data?: any;
  error?: string;
};

type BirthConfig = {
  date: string;
  time: string;
  city: string;
  state: string;
};

export default function ChartPage() {
  // Visible input UI
  const [birthDate, setBirthDate] = useState("1990-01-24");
  const [birthTime, setBirthTime] = useState("01:39");
  const [city, setCity] = useState("Danville");
  const [stateRegion, setStateRegion] = useState("VA");

  // Active config (applied when user clicks Generate chart)
  const [birthConfig, setBirthConfig] = useState<BirthConfig>({
    date: "1990-01-24",
    time: "01:39",
    city: "Danville",
    state: "VA",
  });

  // Transit date (moves with controls)
  const [transitDate, setTransitDate] = useState<Date>(() => new Date());

  // Chart states
  const [natalChartRes, setNatalChartRes] = useState<ChartResponse | null>(null);
  const [transitChartRes, setTransitChartRes] = useState<ChartResponse | null>(null);

  const [loadingNatal, setLoadingNatal] = useState(true);
  const [loadingTransit, setLoadingTransit] = useState(true);

  const loading = loadingNatal || loadingTransit;

  // Convert birth config into usable numbers
  function parseBirth(config: BirthConfig | null) {
    if (!config) return null;

    const [yStr, mStr, dStr] = config.date.split("-");
    const [hStr, minStr] = config.time.split(":");

    const year = Number(yStr);
    const month = Number(mStr);
    const day = Number(dStr);
    const hour = Number(hStr);
    const minute = Number(minStr);

    // TEMP — mapping City/State → coords comes later
    const lat = 36.585;
    const lon = -79.395;

    if (!year || !month || !day) return null;

    return { year, month, day, hour, minute, lat, lon };
  }

  // Fetch NATAL DATA
  useEffect(() => {
    const parsed = parseBirth(birthConfig);
    if (!parsed) {
      setNatalChartRes({ ok: false, error: "Invalid birth data." });
      setLoadingNatal(false);
      return;
    }

    const { year, month, day, hour, minute, lat, lon } = parsed;

    async function loadNatal() {
      setLoadingNatal(true);
      try {
        const res = await fetch("/api/chart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            year,
            month,
            day,
            hour,
            minute,
            latitude: lat,
            longitude: lon,
          }),
        });

        const json = await res.json();
        setNatalChartRes(json);
      } catch (e: any) {
        setNatalChartRes({ ok: false, error: e.message });
      } finally {
        setLoadingNatal(false);
      }
    }

    loadNatal();
  }, [birthConfig]);

  // Fetch TRANSIT DATA
  useEffect(() => {
    const parsed = parseBirth(birthConfig);
    if (!parsed) {
      setTransitChartRes({ ok: false, error: "Invalid birth data." });
      setLoadingTransit(false);
      return;
    }

    const { lat, lon } = parsed;

    async function loadTransits() {
      setLoadingTransit(true);
      try {
        const d = transitDate;

        const res = await fetch("/api/chart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            year: d.getUTCFullYear(),
            month: d.getUTCMonth() + 1,
            day: d.getUTCDate(),
            hour: d.getUTCHours(),
            minute: d.getUTCMinutes(),
            latitude: lat,
            longitude: lon,
          }),
        });

        const json = await res.json();
        setTransitChartRes(json);
      } catch (e: any) {
        setTransitChartRes({ ok: false, error: e.message });
      } finally {
        setLoadingTransit(false);
      }
    }

    loadTransits();
  }, [birthConfig, transitDate]);

  const natalChart =
    natalChartRes?.ok && natalChartRes.data ? natalChartRes.data : null;

  const transitChart =
    transitChartRes?.ok && transitChartRes.data ? transitChartRes.data : null;

  // Prepare planets for strip
  const natalPlanetsForStrip =
    natalChart?.planets
      ? Object.entries(natalChart.planets).map(([name, p]: [string, any]) => ({
          name,
          longitude: p.longitude ?? p.lon ?? p.lng ?? 0,
        }))
      : [];

  const transitPlanetsForStrip =
    transitChart?.planets
      ? Object.entries(transitChart.planets).map(([name, p]: [string, any]) => ({
          name,
          longitude: p.longitude ?? p.lon ?? p.lng ?? 0,
        }))
      : [];

  // Transit time controls
  const shiftTransitDays = (delta: number) => {
    setTransitDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + delta);
      return d;
    });
  };

  const shiftTransitMonths = (delta: number) => {
    setTransitDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + delta);
      return d;
    });
  };

  const transitDateLabel = transitDate.toISOString().slice(0, 10);

  // Generate chart
  const handleGenerateChart = () => {
    setBirthConfig({
      date: birthDate,
      time: birthTime,
      city,
      state: stateRegion,
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#1B1F24",
        padding: "24px 12px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 960, display: "flex", flexDirection: "column", gap: 32 }}>
        
        {/* ————————————————————————————————
            BIRTH INPUT BAR
        ———————————————————————————————— */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            justifyContent: "center",
            alignItems: "center",
            background: "#222933",
            padding: "10px 16px",
            borderRadius: 999,
            fontFamily: "system-ui",
            fontSize: 12,
            color: "#EDE3CC",
          }}
        >
          <span style={{ opacity: 0.8 }}>Birth data:</span>

          <label>
            Birth date{" "}
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              style={inputStyle}
            />
          </label>

          <label>
            Time{" "}
            <input
              type="time"
              value={birthTime}
              onChange={(e) => setBirthTime(e.target.value)}
              style={inputStyle}
            />
          </label>

          <label>
            City{" "}
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={{ ...inputStyle, width: 120 }}
            />
          </label>

          <label>
            State{" "}
            <input
              type="text"
              value={stateRegion}
              onChange={(e) => setStateRegion(e.target.value)}
              style={{ ...inputStyle, width: 60 }}
            />
          </label>

          <button
            type="button"
            onClick={handleGenerateChart}
            style={{ ...buttonStyle, paddingInline: 14 }}
          >
            Generate chart
          </button>
        </div>

        {/* ————————————————————————————————
            WHEEL (WITH SPACING FIX)
        ———————————————————————————————— */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 80 }}>
          <div style={{ transform: "scale(1.2)", transformOrigin: "top center" }}>
            {loading && (
              <div style={{ color: "#EDE3CC", textTransform: "uppercase" }}>
                Calculating chart…
              </div>
            )}

            {!loading && natalChart && <AstroWheel chart={natalChart} />}

            {!loading && !natalChart && (
              <div style={{ color: "#FFB0B0" }}>
                Error: {natalChartRes?.error}
              </div>
            )}
          </div>
        </div>

        {/* ————————————————————————————————
            TRANSIT CONTROLS + STRIP
        ———————————————————————————————— */}
        {natalChart && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontFamily: "system-ui",
                color: "#EDE3CC",
                fontSize: 12,
              }}
            >
              Transits for{" "}
              <span
                style={{
                  padding: "3px 8px",
                  borderRadius: 999,
                  background: "#222933",
                  border: "1px solid #3a4550",
                }}
              >
                {transitDateLabel}
              </span>

              <button onClick={() => shiftTransitDays(-1)} style={buttonStyle}>
                −1 day
              </button>
              <button onClick={() => shiftTransitDays(1)} style={buttonStyle}>
                +1 day
              </button>
              <button onClick={() => shiftTransitMonths(-1)} style={buttonStyle}>
                −1 month
              </button>
              <button onClick={() => shiftTransitMonths(1)} style={buttonStyle}>
                +1 month
              </button>
            </div>

            <div style={{ width: "100%" }}>
              <LinearZodiacBar
                ascDeg={natalChart.ascendant}
                mcDeg={natalChart.mc}
                natalPlanets={natalPlanetsForStrip}
                transitPlanets={transitPlanetsForStrip}
              />
            </div>
          </div>
        )}

        {/* ————————————————————————————————
            INFORMATION CARD
        ———————————————————————————————— */}
        {natalChart && (
          <div
            style={{
              background: "#243039",
              borderRadius: 20,
              padding: 20,
              boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
              color: "#F1E9D2",
              fontFamily: "system-ui",
            }}
          >
            <h1 style={{ margin: 0, marginBottom: 8, fontSize: 22 }}>
              Natal Chart Prototype
            </h1>
            <p style={{ opacity: 0.8 }}>
              This analog-cosmic wheel is powered by the URA astro engine. The
              strip unwraps the zodiac, showing natal planets on the bottom row
              and transits on the top.
            </p>

            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              <div>
                <strong>Natal Julian Day:</strong>{" "}
                {natalChart.julianDay.toFixed(5)}
              </div>

              <div>
                <strong>ASC:</strong> {natalChart.ascendant.toFixed(2)}°
              </div>

              <div>
                <strong>MC:</strong> {natalChart.mc.toFixed(2)}°
              </div>

              {transitChart && (
                <div style={{ marginTop: 10 }}>
                  <strong>Transit JD:</strong>{" "}
                  {transitChart.julianDay.toFixed(5)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle: CSSProperties = {
  background: "#1B1F24",
  border: "1px solid #3a4550",
  borderRadius: 6,
  padding: "3px 6px",
  color: "#EDE3CC",
  fontSize: 12,
};

const buttonStyle: CSSProperties = {
  background: "transparent",
  border: "1px solid #3a4550",
  borderRadius: 999,
  padding: "3px 10px",
  color: "#EDE3CC",
  fontSize: 11,
  cursor: "pointer",
};
