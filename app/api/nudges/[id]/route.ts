import { NextResponse } from "next/server";

import { getDb } from "@/app/lib/db";
import type { Nudge } from "@/app/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type NudgeRow = {
  id: string;
  candidate_id: string | null;
  owner: string;
  reason: string;
  due_at: string | null;
  status: Nudge["status"];
  created_at: string;
};

const STATUSES: readonly Nudge["status"][] = ["open", "done", "dismissed"];

function isNudgeStatus(value: unknown): value is Nudge["status"] {
  return typeof value === "string" && STATUSES.includes(value as Nudge["status"]);
}

function nudgeFromRow(row: NudgeRow): Nudge {
  return {
    id: row.id,
    candidateId: row.candidate_id,
    owner: row.owner,
    reason: row.reason,
    dueAt: row.due_at,
    status: row.status,
    createdAt: row.created_at
  };
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const payload = (await request.json().catch(() => ({}))) as { status?: unknown };

  if (!isNudgeStatus(payload.status)) {
    return NextResponse.json({ ok: false, error: "Invalid nudge status." }, { status: 400 });
  }

  const db = getDb();
  const result = db.prepare("UPDATE nudges SET status = ? WHERE id = ?").run(payload.status, id);

  if (result.changes === 0) {
    return NextResponse.json({ ok: false, error: "Nudge not found." }, { status: 404 });
  }

  const row = db.prepare("SELECT * FROM nudges WHERE id = ?").get(id) as NudgeRow;
  return NextResponse.json({ ok: true, nudge: nudgeFromRow(row) });
}
