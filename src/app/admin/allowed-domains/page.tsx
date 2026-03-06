import { createAdminClient } from "@/lib/supabase/admin";
import { createAllowedDomain, updateAllowedDomain, deleteAllowedDomain } from "../actions";
import Link from "next/link";
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 25;

export default async function AllowedDomainsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; edit?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const editId = params.edit ? parseInt(params.edit) : null;
  const offset = (page - 1) * PAGE_SIZE;
  const admin = createAdminClient();

  const { data: rows, count } = await admin
    .from("allowed_signup_domains")
    .select("id, apex_domain, created_datetime_utc", { count: "exact" })
    .order("created_datetime_utc", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);
  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[#00ff41] text-lg font-bold tracking-wider glow-text">ALLOWED SIGNUP DOMAINS</h1>
        <p className="text-[#252525] text-[10px] mt-1">{count ?? 0} domains configured</p>
      </div>

      <div className="terminal-card p-4">
        <h2 className="text-[#00ff41] text-[10px] font-bold uppercase tracking-[0.15em] mb-3">+ Add Domain</h2>
        <form action={createAllowedDomain} className="flex items-end gap-3">
          <div className="flex-1 max-w-sm">
            <label className="block text-[#404040] text-[9px] uppercase tracking-wider mb-1">Apex Domain</label>
            <input name="apex_domain" className="input-terminal" placeholder="example.com" required />
          </div>
          <button type="submit" className="btn-terminal !text-[#00ff41]">[CREATE]</button>
        </form>
      </div>

      {editId && rows?.find((r) => r.id === editId) && (
        <div className="terminal-card p-4">
          <h2 className="text-[#00d4ff] text-[10px] font-bold uppercase tracking-[0.15em] mb-3">Edit Domain #{editId}</h2>
          <form action={updateAllowedDomain.bind(null, editId)} className="flex items-end gap-3">
            <div className="flex-1 max-w-sm">
              <label className="block text-[#404040] text-[9px] uppercase tracking-wider mb-1">Apex Domain</label>
              <input name="apex_domain" defaultValue={rows.find((r) => r.id === editId)!.apex_domain} className="input-terminal" required />
            </div>
            <button type="submit" className="btn-terminal !text-[#00ff41]">[SAVE]</button>
            <Link href="/admin/allowed-domains" className="btn-terminal">[CANCEL]</Link>
          </form>
        </div>
      )}

      <div className="terminal-card overflow-x-auto">
        <table className="table-admin">
          <thead><tr><th>ID</th><th>Apex Domain</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
            {rows?.map((r) => (
              <tr key={r.id} className={editId === r.id ? "!bg-[#00d4ff]/5" : ""}>
                <td className="text-[#00ff41]/50">{r.id}</td>
                <td className="text-[#b0b0b0]">{r.apex_domain}</td>
                <td className="text-[#404040] text-[10px] whitespace-nowrap">{new Date(r.created_datetime_utc).toLocaleDateString()}</td>
                <td>
                  <div className="flex gap-1.5">
                    <Link href={`/admin/allowed-domains?edit=${r.id}`} className="btn-terminal text-[10px]">[EDIT]</Link>
                    <form action={deleteAllowedDomain.bind(null, r.id)}><button type="submit" className="btn-terminal text-[10px] hover:!text-[#ff0033] hover:!border-[#ff0033]"><Trash2 size={11} /></button></form>
                  </div>
                </td>
              </tr>
            ))}
            {(!rows || rows.length === 0) && (
              <tr><td colSpan={4} className="text-center text-[#1a3a1a] py-10">No domains configured</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs">
          <p className="text-[#303030]">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && <Link href={`/admin/allowed-domains?page=${page - 1}`} className="btn-terminal flex items-center gap-1"><ChevronLeft size={12} /> Prev</Link>}
            {page < totalPages && <Link href={`/admin/allowed-domains?page=${page + 1}`} className="btn-terminal flex items-center gap-1">Next <ChevronRight size={12} /></Link>}
          </div>
        </div>
      )}
    </div>
  );
}
