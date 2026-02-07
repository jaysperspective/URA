// src/app/api/human-design/reads/route.ts
// POST endpoint: generate (or return cached) HD General Read + Daily Operating Code.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { HumanDesignProfile } from "@/lib/humandesign/types";
import { buildHdSummary, computeChartHash } from "@/lib/humandesign/hdSummary";
import {
  HD_READ_PROMPT_VERSION,
  systemPrompt,
  userPrompt,
} from "@/lib/humandesign/hdReadPrompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Helpers (same pattern as /api/profile/brief)
// ---------------------------------------------------------------------------

function getApiKey(): string {
  return (
    process.env.OPENAI_API_KEY ||
    process.env.URA_OPENAI_API_KEY ||
    process.env.OPENAI_KEY ||
    ""
  ).trim();
}

function getModel(): string {
  return (
    process.env.URA_OPENAI_MODEL ||
    process.env.OPENAI_MODEL ||
    "gpt-4.1-mini"
  ).trim();
}

type ReadResult = {
  generalRead: string;
  dailyOperatingCode: string;
};

async function callOpenAI(
  apiKey: string,
  model: string,
  sys: string,
  user: string
): Promise<ReadResult> {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
    }),
  });

  const data = await r.json().catch(() => null);

  if (!r.ok) {
    const msg = data?.error?.message || `OpenAI error ${r.status}`;
    throw new Error(msg);
  }

  const txt = data?.choices?.[0]?.message?.content || "";
  const parsed = JSON.parse(txt);

  if (
    typeof parsed?.generalRead !== "string" ||
    typeof parsed?.dailyOperatingCode !== "string"
  ) {
    throw new Error("LLM response missing required fields");
  }

  return {
    generalRead: parsed.generalRead,
    dailyOperatingCode: parsed.dailyOperatingCode,
  };
}

// ---------------------------------------------------------------------------
// POST /api/human-design/reads
// ---------------------------------------------------------------------------

type ApiResponse = {
  ok: boolean;
  status: "ready" | "generating" | "error";
  cached?: boolean;
  generalRead?: string;
  dailyOperatingCode?: string;
  generatedAt?: string;
  promptVersion?: string;
  error?: string;
};

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // 1. Auth
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, status: "error", error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const force = Boolean(body?.force);

    // 2. Load HD profile from cache
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { humanDesignJson: true },
    });

    if (!profile?.humanDesignJson) {
      return NextResponse.json(
        { ok: false, status: "error", error: "No Human Design data. Compute your chart first." },
        { status: 400 }
      );
    }

    const hd = profile.humanDesignJson as unknown as HumanDesignProfile;

    // 3. Build summary + hash
    const summary = buildHdSummary(hd);
    const chartHash = computeChartHash(summary);

    // 4. Check cache
    if (!force) {
      try {
        const cached = await prisma.hdReadCache.findUnique({
          where: { userId_chartHash: { userId: user.id, chartHash } },
        });

        if (cached) {
          if (
            cached.status === "READY" &&
            cached.promptVersion === HD_READ_PROMPT_VERSION &&
            cached.generalRead &&
            cached.dailyOperatingCode
          ) {
            return NextResponse.json({
              ok: true,
              status: "ready",
              cached: true,
              generalRead: cached.generalRead,
              dailyOperatingCode: cached.dailyOperatingCode,
              generatedAt: cached.generatedAt?.toISOString(),
              promptVersion: cached.promptVersion,
            });
          }

          if (cached.status === "PENDING") {
            return NextResponse.json(
              { ok: true, status: "generating" },
              { status: 202 }
            );
          }
        }
      } catch (cacheErr) {
        console.error("[HD Reads] Cache lookup failed:", cacheErr);
      }
    }

    // 5. Check API key
    const apiKey = getApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, status: "error", error: "Missing OpenAI API key." },
        { status: 500 }
      );
    }

    // 6. Upsert PENDING row (prevents concurrent generation)
    try {
      await prisma.hdReadCache.upsert({
        where: { userId_chartHash: { userId: user.id, chartHash } },
        update: { status: "PENDING", errorMessage: null },
        create: {
          userId: user.id,
          chartHash,
          status: "PENDING",
          promptVersion: HD_READ_PROMPT_VERSION,
        },
      });
    } catch (upsertErr) {
      console.error("[HD Reads] PENDING upsert failed:", upsertErr);
    }

    // 7. Call OpenAI
    const model = getModel();
    let result: ReadResult;

    try {
      result = await callOpenAI(apiKey, model, systemPrompt(), userPrompt(summary));
    } catch (firstErr: any) {
      // Retry once
      try {
        result = await callOpenAI(apiKey, model, systemPrompt(), userPrompt(summary));
      } catch (retryErr: any) {
        // Mark as ERROR
        try {
          await prisma.hdReadCache.update({
            where: { userId_chartHash: { userId: user.id, chartHash } },
            data: {
              status: "ERROR",
              errorMessage: retryErr?.message || "LLM generation failed",
            },
          });
        } catch {}

        return NextResponse.json(
          { ok: false, status: "error", error: retryErr?.message || "Generation failed" },
          { status: 500 }
        );
      }
    }

    // 8. Update cache with result
    const now = new Date();
    try {
      await prisma.hdReadCache.update({
        where: { userId_chartHash: { userId: user.id, chartHash } },
        data: {
          status: "READY",
          generalRead: result.generalRead,
          dailyOperatingCode: result.dailyOperatingCode,
          model,
          promptVersion: HD_READ_PROMPT_VERSION,
          generatedAt: now,
          errorMessage: null,
        },
      });
    } catch (cacheErr) {
      console.error("[HD Reads] Cache write failed:", cacheErr);
    }

    return NextResponse.json({
      ok: true,
      status: "ready",
      cached: false,
      generalRead: result.generalRead,
      dailyOperatingCode: result.dailyOperatingCode,
      generatedAt: now.toISOString(),
      promptVersion: HD_READ_PROMPT_VERSION,
    });
  } catch (err: any) {
    console.error("[HD Reads] Error:", err);
    return NextResponse.json(
      { ok: false, status: "error", error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
