import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import { spawn } from "child_process";
import path from "path";
import { computeMetrics, type Segment } from "@/lib/speechMetrics";
import { getPrimerTerms, applyCorrections } from "@/lib/vocab";
import { readAppSettings } from "@/lib/settings";

export const runtime = "nodejs";
export const maxDuration = 300;

interface ToneInfo {
  available: boolean;
  pitch?: { median_hz: number; variation_st: number; range_st: number };
  energy_variation?: number;
  long_pauses?: number;
  longest_pause_sec?: number;
  speaking_ratio?: number;
  delivery?: string;
  baseline?: unknown;
}

interface TranscribeResult {
  text: string;
  language: string;
  duration: number;
  segments: Segment[];
  tone?: ToneInfo;
}

function runPython(
  audioPath: string,
  language: string,
  extraTerms: string,
): Promise<TranscribeResult> {
  return new Promise((resolve, reject) => {
    const script = path.join(process.cwd(), "scripts", "transcribe-one.py");
    const child = spawn("python", [script, audioPath, language, extraTerms], {
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
      timeout: 240_000,
    });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) return reject(new Error(`transcriber exited ${code}: ${err.slice(-300)}`));
      try {
        resolve(JSON.parse(out.trim().split("\n").pop() ?? ""));
      } catch {
        reject(new Error("transcriber returned invalid output"));
      }
    });
  });
}

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!(audio instanceof File)) {
    return NextResponse.json({ error: "No audio uploaded" }, { status: 400 });
  }
  const langRaw = String(form?.get("language") ?? "ar");
  const language = ["ar", "en", "auto"].includes(langRaw) ? langRaw : "ar";
  if (audio.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: "Recording too large (max 25MB)" }, { status: 400 });
  }

  const dir = path.join(process.cwd(), "data", "raw", "recordings");
  await mkdir(dir, { recursive: true });
  const ext = audio.type.includes("ogg") ? "ogg" : audio.type.includes("mp4") ? "m4a" : "webm";
  const filePath = path.join(dir, `rec-${Date.now()}.${ext}`);
  await writeFile(filePath, Buffer.from(await audio.arrayBuffer()));

  try {
    const terms = await getPrimerTerms();
    const t = await runPython(filePath, language, terms.join("، "));
    // Fixes the user has confirmed before are applied automatically.
    t.text = await applyCorrections(t.text);
    if (!t.text || t.text.trim().length < 2) {
      return NextResponse.json(
        { error: "Nothing was recognized — speak closer to the microphone and try again." },
        { status: 422 }
      );
    }
    const metrics = computeMetrics(t.text, t.segments, t.duration);
    // Pauses measured from the waveform beat segment boundaries, which collapse
    // to a single segment on short clips.
    if (t.tone?.available && typeof t.tone.long_pauses === "number") {
      metrics.longPauses = t.tone.long_pauses;
      metrics.longestPauseSec = t.tone.longest_pause_sec ?? metrics.longestPauseSec;
    }
    // Re-label delivery against this user's own measured range, not a generic
    // cutoff — a naturally flat speaker and an animated one differ a lot.
    const baseline = readAppSettings().voiceBaseline;
    const tone = t.tone;
    if (tone?.available && tone.pitch && baseline) {
      const v = tone.pitch.variation_st;
      tone.delivery =
        v < baseline.lowVariationSt
          ? "flat"
          : v >= baseline.medianVariationSt
            ? "varied"
            : "moderate";
      tone.baseline = baseline;
    }
    return NextResponse.json({ transcript: t.text, language: t.language, metrics, audioPath: filePath, durationSec: t.duration, segments: t.segments, tone: tone ?? null });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Transcription failed" },
      { status: 500 }
    );
  }
}
