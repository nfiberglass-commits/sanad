import { NextResponse } from "next/server";
import { generateProfile } from "@/lib/profile";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST() {
  try {
    const result = await generateProfile();
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Profile generation failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
