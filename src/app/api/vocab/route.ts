import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { addTerm, removeTerm } from "@/lib/vocab";

export const runtime = "nodejs";

export async function GET() {
  const [terms, corrections] = await Promise.all([
    prisma.vocabTerm.findMany({ orderBy: [{ createdAt: "desc" }], take: 200 }),
    prisma.correction.findMany({ orderBy: { count: "desc" }, take: 50 }),
  ]);
  return NextResponse.json({ terms, corrections });
}

const AddBody = z.object({
  terms: z.string().min(1).max(2000),
  kind: z.enum(["person", "product", "place", "term"]).default("term"),
});

export async function POST(req: NextRequest) {
  const parsed = AddBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  // Accept a comma / newline separated list so a whole team can be pasted at once.
  const list = parsed.data.terms
    .split(/[,\n،]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
    .slice(0, 100);
  let added = 0;
  for (const t of list) {
    const row = await addTerm(t, parsed.data.kind);
    if (row) added++;
  }
  return NextResponse.json({ added });
}

const DelBody = z.object({ id: z.string().min(1) });

export async function DELETE(req: NextRequest) {
  const parsed = DelBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  await removeTerm(parsed.data.id);
  return NextResponse.json({ ok: true });
}
