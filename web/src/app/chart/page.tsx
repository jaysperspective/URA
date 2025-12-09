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
  date: string;   // YYYY-MM-DD
  time: string;   // HH:MM
  city: string;
  state: string;
};

export default function ChartPage() {
  // Form state
  const [birthDate, setBirthDate] = useState("1990-01-24");
  const [birthTime, setBirthTime] = useState("01:39");
  const [city, setCity] = useState("Danville");
  const [stateRegion, setStateRegion] = useState("VA");

  // Active config (what the chart is actually using)
  const [birthConfig, setBirthConfig] = useState<BirthConfig>({
    date: "1990-01-24",
    time: "01:39",
    city: "Danville",
    state: "VA",
  });

  // Transit date state (moves with controls)
  const [transitDate, setTransitDate] = useState<Date>(() => new Date());

  // Chart data state
  const [natalChartRes, setNatalChartRes] = useState<ChartResponse | null>(null);
  const [transitChartRes, setTransitChartRes] = useState<ChartResponse | null>(
    null
  );
  const [loadingNatal, setLoadingNatal] = useState(true);
  const [loadingTransit, setLoadingTransit] = useState(true);

  const loading = loadingNatal || loadingTransit;

  function parseBirth(config: BirthConfig | null) {
    if (!config) return null;

    const { date, time } = config;
    const [yStr, mStr, dStr] = date.split("-");
    const [hStr, minStr] = time.split(":");

    const year = Number(yStr);
    const month = Number(mStr);
    const day = Number(dStr);
    const hour = Number(hStr);
    const minute = Number(minStr);

    // For now: fixed coords for birthplace (Danville, VA).
    const lat = 36.585;
    const lon = -79.395;

    if (!year || !month || !day) return null;

    return { year, month, day, hour: hour || 0, minute: minute || 0, lat, lon };
  }

  // Fetch natal chart when active birthConfig changes
  useEffect(() => {
    const parsed = parseBirth(birthConfig);
    if (!parsed) {
      setNatalChartRes({
        ok: false,
        error: "Invalid birth data. Check birth date and time.",
      });
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
        setNatalChartRes({
          ok: false,
          error: e.message || "Failed to load natal chart",
        });
      } finally {
        setLoadingNatal(false);
      }
    }

    loadNatal();
  }, [birthConfig]);

  // Fetch transits whenever transitDate or active config changes
  useEffect(() => {
    const parsed = parseBirth(birthConfig);
    if (!parsed) {
      setTransitChartRes({
        ok: false,
        error: "Invalid data for transit calculation.",
      });
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
        setTransitChartRes({
          ok: false,
          error: e.message || "Failed to load transits",
        });
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

  // Time control helpers
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

  // Handle "Generate chart" click
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
          gap: 24,
        }}
      >
        {/* BIRTH INPUT BAR */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "system-ui, sans-serif",
            fontSize: 12,
            color: "#EDE3CC",
            background: "#222933",
            padding: "10px 16px",
            borderRadius: 999,
          }}
        >
          <span style={{ opacity: 0.8 }}>Birth data:</span>

          <label>
            <span style={{ marginRight: 4, opacity: 0.7 }}>Birth date</span>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              style={inputStyle}
            />
          </label>

          <label>
            <span style={{ marginRight: 4, opacity: 0.7 }}>Time</span>
            <input
              type="time"
              value={birthTime}
              onChange={(e) => setBirthTime(e.target.value)}
              style={inputStyle}
            />
          </label>

          <label>
            <span style={{ marginRight: 4, opacity: 0.7 }}>City</span>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={{ ...inputStyle, width: 120 }}
            />
          </label>

          <label>
            <span style={{ marginRight: 4, opacity: 0.7 }}>State</span>
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
            style={{
              ...buttonStyle,
              paddingInline: 14,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            Generate chart
          </button>
        </div>

        {/* WHEEL – bigger via scale */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            transform: "scale(1.2)",
            transformOrigin: "top center",
          }}
        >
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

        {/* TRANSIT CONTROLS + STRIP (grouped together, with extra spacing) */}
        {natalChart && (
          <div
            style={{
              marginTop: 32,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontFamily: "system-ui, sans-serif",
                fontSize: 12,
                color: "#EDE3CC",
              }}
            >
              <span style={{ opacity: 0.8 }}>Transits for</span>
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

              <button
                onClick={() => shiftTransitDays(-1)}
                style={buttonStyle}
                type="button"
              >
                −1 day
              </button>
              <button
                onClick={() => shiftTransitDays(1)}
                style={buttonStyle}
                type="button"
              >
                +1 day
              </button>
              <button
                onClick={() => shiftTransitMonths(-1)}
                style={buttonStyle}
                type="button"
              >
                −1 month
              </button>
              <button
                onClick={() => shiftTransitMonths(1)}
                style={buttonStyle}
                type="button"
              >
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
              ride the bottom track, while today&apos;s sky (or any date you
              choose) moves along the top.
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
                  <strong>Transit Julian Day:</strong>{" "}
                  {transitChart.julianDay.toFixed(5)}
                </div>
              )}

              <div style={{ marginTop: 12, opacity: 0.8 }}>
                From here, we can add aspect overlays, tap / hover to inspect
                specific planets, and eventually hook this into the broader URA
                reading engine.
              </div>
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
