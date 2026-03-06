import { createAdminClient } from "@/lib/supabase/admin";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 25;

export default async function LlmPromptChainsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const offset = (page - 1) * PAGE_SIZE;
  const admin = createAdminClient();

  const { data: rows, count } = await admin
    .from("llm_prompt_chains")
    .select("id, created_datetime_utc, caption_request_id", { count: "exact" })
    .order("created_datetime_utc", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[#00ff41] text-lg font-bold tracking-wider glow-text">
          LLM PROMPT CHAINS
        </h1>
        <p className="text-[#252525] text-[10px] mt-1">{count ?? 0} chains recorded</p>
      </div>

      <div className="terminal-card overflow-x-auto">
        <table className="table-admin">
          <thead>
            <tr><th>ID</th><th>Caption Request ID</th><th>Created</th></tr>
          </thead>
          <tbody>
            {rows?.map((r) => (
              <tr key={r.id}>
                <td className="text-[#00ff41]/50">{r.id}</td>
                <td className="tabular-nums">{r.caption_request_id}</td>
                <td className="text-[#404040] text-[10px] whitespace-nowrap">
                  {new Date(r.created_datetime_utc).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {(!rows || rows.length === 0) && (
              <tr><td colSpan={3} className="text-center text-[#1a3a1a] py-10">No chains found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs">
          <p className="text-[#303030]">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && <Link href={`/admin/llm-prompt-chains?page=${page - 1}`} className="btn-terminal flex items-center gap-1"><ChevronLeft size={12} /> Prev</Link>}
            {page < totalPages && <Link href={`/admin/llm-prompt-chains?page=${page + 1}`} className="btn-terminal flex items-center gap-1">Next <ChevronRight size={12} /></Link>}
          </div>
        </div>
      )}
    </div>
  );
}
