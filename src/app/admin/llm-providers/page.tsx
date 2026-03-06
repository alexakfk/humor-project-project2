import { createAdminClient } from "@/lib/supabase/admin";
import { createLlmProvider, updateLlmProvider, deleteLlmProvider } from "../actions";
import Link from "next/link";
import { Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LlmProvidersPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const params = await searchParams;
  const editId = params.edit ? parseInt(params.edit) : null;
  const admin = createAdminClient();

  const { data: rows } = await admin
    .from("llm_providers")
    .select("id, name, created_datetime_utc")
    .order("id", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[#00ff41] text-lg font-bold tracking-wider glow-text">LLM PROVIDERS</h1>
        <p className="text-[#252525] text-[10px] mt-1">{rows?.length ?? 0} providers registered</p>
      </div>

      <div className="terminal-card p-4">
        <h2 className="text-[#00ff41] text-[10px] font-bold uppercase tracking-[0.15em] mb-3">+ Add Provider</h2>
        <form action={createLlmProvider} className="flex items-end gap-3">
          <div className="flex-1 max-w-sm">
            <label className="block text-[#404040] text-[9px] uppercase tracking-wider mb-1">Name</label>
            <input name="name" className="input-terminal" placeholder="e.g. OpenAI" required />
          </div>
          <button type="submit" className="btn-terminal !text-[#00ff41]">[CREATE]</button>
        </form>
      </div>

      {editId && rows?.find((r) => r.id === editId) && (
        <div className="terminal-card p-4">
          <h2 className="text-[#00d4ff] text-[10px] font-bold uppercase tracking-[0.15em] mb-3">Edit Provider #{editId}</h2>
          <form action={updateLlmProvider.bind(null, editId)} className="flex items-end gap-3">
            <div className="flex-1 max-w-sm">
              <label className="block text-[#404040] text-[9px] uppercase tracking-wider mb-1">Name</label>
              <input name="name" defaultValue={rows.find((r) => r.id === editId)!.name} className="input-terminal" required />
            </div>
            <button type="submit" className="btn-terminal !text-[#00ff41]">[SAVE]</button>
            <Link href="/admin/llm-providers" className="btn-terminal">[CANCEL]</Link>
          </form>
        </div>
      )}

      <div className="terminal-card overflow-x-auto">
        <table className="table-admin">
          <thead><tr><th>ID</th><th>Name</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
            {rows?.map((r) => (
              <tr key={r.id} className={editId === r.id ? "!bg-[#00d4ff]/5" : ""}>
                <td className="text-[#00ff41]/50">{r.id}</td>
                <td className="text-[#b0b0b0]">{r.name}</td>
                <td className="text-[#404040] text-[10px] whitespace-nowrap">{new Date(r.created_datetime_utc).toLocaleDateString()}</td>
                <td>
                  <div className="flex gap-1.5">
                    <Link href={`/admin/llm-providers?edit=${r.id}`} className="btn-terminal text-[10px]">[EDIT]</Link>
                    <form action={deleteLlmProvider.bind(null, r.id)}><button type="submit" className="btn-terminal text-[10px] hover:!text-[#ff0033] hover:!border-[#ff0033]"><Trash2 size={11} /></button></form>
                  </div>
                </td>
              </tr>
            ))}
            {(!rows || rows.length === 0) && (
              <tr><td colSpan={4} className="text-center text-[#1a3a1a] py-10">No providers found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
