import { NextRequest, NextResponse } from "next/server";
import { getSession, pushEvent, disableSync, setSync } from "@/lib/store";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession(params.id);
  if (!session) return NextResponse.json({ error: "sesi tidak ditemukan" }, { status: 404 });
  if (!session.syncEnabled) return NextResponse.json({ ok: false, reason: "sync mati" }, { status: 200 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "body tidak valid" }, { status: 400 });

  pushEvent(params.id, { ...body, id: crypto.randomUUID(), ts: Date.now() });
  return NextResponse.json({ ok: true });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession(params.id);
  if (!session) return NextResponse.json({ error: "sesi tidak ditemukan" }, { status: 404 });
  return NextResponse.json({
    sessionId: session.id,
    syncEnabled: session.syncEnabled,
    events: session.events,
  });
}

export async function PUT(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = setSync(params.id, true);
  if (!session) return NextResponse.json({ error: "sesi tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ ok: true, syncEnabled: session.syncEnabled });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = disableSync(params.id);
  if (!session) return NextResponse.json({ error: "sesi tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ ok: true, syncEnabled: session.syncEnabled });
}
