import { NextResponse } from "next/server";
import { offeredMeta } from "@/lib/core/registry";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";

export const runtime = "nodejs";

/** GET /api/systems — offered-system metadata for the UI (requirements, lineage). */
export function GET() {
  return NextResponse.json({ ontologyVersion: ONTOLOGY_VERSION, systems: offeredMeta() });
}
