import type { NextRequest } from "next/server";
import { requireBusiness } from "@/lib/business";
import { CSV_SECTIONS, readPeriod, sectionCsv, type Report } from "@/lib/reports";

/** One report section as a CSV download (FR-RP-01). */
export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const section = CSV_SECTIONS.find((s) => s === params.section);
  if (!section) return new Response("Unknown report", { status: 404 });

  const { from, to } = readPeriod(params);
  const { supabase, business } = await requireBusiness();
  const { data, error } = await supabase.rpc("business_report", {
    p_business_id: business.id,
    p_from: from,
    p_to: to,
  });
  if (error) return new Response(error.message, { status: 400 });

  const { filename, csv } = sectionCsv(data as Report, section);
  // A byte order mark so Excel reads N$ amounts and names as UTF-8.
  return new Response(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
