import { createAdminClient } from "@/lib/supabase/admin";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 25;

export default async function LlmResponsesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const offset = (page - 1) * PAGE_SIZE;
  const admin = createAdminClient();

  const { data: rows, count } = await admin
    .from("llm_model_responses")
    .select(
      "id, created_datetime_utc, processing_time_seconds, llm_temperature, llm_models(name), humor_flavors(slug), profiles(first_name, last_name)",
      { count: "exact" }
    )
    .order("created_datetime_utc", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[#00ff41] text-lg font-bold tracking-wider glow-text">
          LLM RESPONSES
        </h1>
        <p className="text-[#252525] text-[10px] mt-1">{count ?? 0} responses recorded</p>
      </div>

      <div className="terminal-card overflow-x-auto">
        <table className="table-admin">
          <thead>
            <tr>
              <th>ID</th><th>Model</th><th>Flavor</th><th>Profile</th>
              <th>Proc Time</th><th>Temp</th><th>Created</th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((r) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const m = r.llm_models as any;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const f = r.humor_flavors as any;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const p = r.profiles as any;
              return (
                <tr key={r.id}>
                  <td className="text-[#00ff41]/50 text-[10px] max-w-[80px] truncate">{r.id}</td>
                  <td className="text-[#00d4ff]">{m?.name || "\u2014"}</td>
                  <td>{f?.slug || "\u2014"}</td>
                  <td className="text-[#707070] text-[10px]">
                    {p ? `${p.first_name || ""} ${p.last_name || ""}`.trim() : "\u2014"}
                  </td>
                  <td className="text-[#ffb000] tabular-nums">{r.processing_time_seconds}s</td>
                  <td className="tabular-nums">{r.llm_temperature ?? "\u2014"}</td>
                  <td className="text-[#404040] text-[10px] whitespace-nowrap">
                    {new Date(r.created_datetime_utc).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
            {(!rows || rows.length === 0) && (
              <tr><td colSpan={7} className="text-center text-[#1a3a1a] py-10">No responses found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs">
          <p className="text-[#303030]">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && <Link href={`/admin/llm-responses?page=${page - 1}`} className="btn-terminal flex items-center gap-1"><ChevronLeft size={12} /> Prev</Link>}
            {page < totalPages && <Link href={`/admin/llm-responses?page=${page + 1}`} className="btn-terminal flex items-center gap-1">Next <ChevronRight size={12} /></Link>}
          </div>
        </div>
      )}
    </div>
  );
}
