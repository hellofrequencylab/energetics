import { NextResponse } from "next/server";
import { allMeta } from "@/lib/core/registry";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";

export const runtime = "nodejs";

/** GET /api/systems — registry metadata for the UI (which systems, requirements, lineage). */
export function GET() {
  return NextResponse.json({ ontologyVersion: ONTOLOGY_VERSION, systems: allMeta() });
}
