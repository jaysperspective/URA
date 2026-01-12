// src/app/profile/ui/ProfileClient.tsx
// (Only change needed here is the fetch cache control inside generateDailyBrief)

async function generateDailyBrief() {
  setBriefLoading(true);
  setBrief(null);

  try {
    const payload = {
      version: "1.0" as const,
      context: {
        season: orientation.ok ? orientation.seasonText : (ascYearSeason || "—"),
        phaseId: orientation.uraPhaseId,
        cyclePosDeg: typeof orientation.cyclePos === "number" ? orientation.cyclePos : null,
        degIntoPhase: typeof orientation.uraDegIntoPhase === "number" ? orientation.uraDegIntoPhase : null,
        phaseProgress01: typeof orientation.uraProgress01 === "number" ? orientation.uraProgress01 : null,

        phaseHeader: phaseCopy.header,
        phaseOneLine: phaseCopy.oneLine,
        phaseDescription: phaseCopy.description,
        phaseActionHint: phaseCopy.actionHint ?? null,
        journalPrompt: phaseCopy.journalPrompt,
        journalHelper: phaseCopy.journalHelper,

        currentSun: currentZodiac,
        lunation: lunationLine,
        progressed: `${progressedSun} • ${progressedMoon}`,
        asOf: asOfLine,
      },
      sabian: sabian
        ? {
            idx: sabian.idx,
            key: sabian.key,
            sign: sabian.sign,
            degree: sabian.degree,
            symbol: sabian.symbol,
            signal: sabian.signal,
            shadow: sabian.shadow,
            directive: sabian.directive,
            practice: sabian.practice,
            journal: sabian.journal,
            tags: sabian.tags ?? [],
          }
        : null,
      output: { maxDoNow: 3, maxAvoid: 2, maxSentencesMeaning: 4 },
      constraints: { noPrediction: true, noNewClaims: true, citeInputs: true },
    };

    const r = await fetch("/api/profile/brief", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      cache: "no-store",
      body: JSON.stringify(payload),
    });

    const data = (await r.json()) as BriefResp;
    setBrief(data);
  } catch (e: any) {
    setBrief({ ok: false, error: e?.message || "Daily Brief failed." });
  } finally {
    setBriefLoading(false);
  }
}
