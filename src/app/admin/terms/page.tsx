import { createAdminClient } from "@/lib/supabase/admin";
import { createTerm, updateTerm, deleteTerm } from "../actions";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 25;

export default async function TermsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; edit?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const page = parseInt(params.page || "1");
  const editId = params.edit ? parseInt(params.edit) : null;
  const offset = (page - 1) * PAGE_SIZE;
  const admin = createAdminClient();

  const [result, { data: termTypes }] = await Promise.all([
    (() => {
      let q = admin
        .from("terms")
        .select("id, term, definition, example, priority, term_type_id, created_datetime_utc, term_types(name)", { count: "exact" });
      if (query) q = q.or(`term.ilike.%${query}%,definition.ilike.%${query}%`);
      return q.order("created_datetime_utc", { ascending: false }).range(offset, offset + PAGE_SIZE - 1);
    })(),
    admin.from("term_types").select("id, name").order("name"),
  ]);

  const { data: rows, count } = result;
  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);
  const editItem = editId ? rows?.find((r) => r.id === editId) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[#00ff41] text-lg font-bold tracking-wider glow-text">TERMS</h1>
        <p className="text-[#252525] text-[10px] mt-1">{count ?? 0} terms defined</p>
      </div>

      <div className="terminal-card p-4">
        <h2 className="text-[#00ff41] text-[10px] font-bold uppercase tracking-[0.15em] mb-3">+ Add Term</h2>
        <form action={createTerm} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-[#404040] text-[9px] uppercase tracking-wider mb-1">Term</label>
            <input name="term" className="input-terminal" required />
          </div>
          <div>
            <label className="block text-[#404040] text-[9px] uppercase tracking-wider mb-1">Definition</label>
            <input name="definition" className="input-terminal" required />
          </div>
          <div>
            <label className="block text-[#404040] text-[9px] uppercase tracking-wider mb-1">Example</label>
            <input name="example" className="input-terminal" required />
          </div>
          <div>
            <label className="block text-[#404040] text-[9px] uppercase tracking-wider mb-1">Priority</label>
            <input name="priority" type="number" defaultValue="0" className="input-terminal w-24" />
          </div>
          <div>
            <label className="block text-[#404040] text-[9px] uppercase tracking-wider mb-1">Type</label>
            <select name="term_type_id" className="input-terminal">
              <option value="">None</option>
              {termTypes?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-terminal !text-[#00ff41]">[CREATE]</button>
        </form>
      </div>

      {editItem && (
        <div className="terminal-card p-4">
          <h2 className="text-[#00d4ff] text-[10px] font-bold uppercase tracking-[0.15em] mb-3">Edit Term #{editId}</h2>
          <form action={updateTerm.bind(null, editId!)} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-[#404040] text-[9px] uppercase tracking-wider mb-1">Term</label>
              <input name="term" defaultValue={editItem.term} className="input-terminal" required />
            </div>
            <div>
              <label className="block text-[#404040] text-[9px] uppercase tracking-wider mb-1">Definition</label>
              <input name="definition" defaultValue={editItem.definition} className="input-terminal" required />
            </div>
            <div>
              <label className="block text-[#404040] text-[9px] uppercase tracking-wider mb-1">Example</label>
              <input name="example" defaultValue={editItem.example} className="input-terminal" required />
            </div>
            <div>
              <label className="block text-[#404040] text-[9px] uppercase tracking-wider mb-1">Priority</label>
              <input name="priority" type="number" defaultValue={editItem.priority} className="input-terminal w-24" />
            </div>
            <div>
              <label className="block text-[#404040] text-[9px] uppercase tracking-wider mb-1">Type</label>
              <select name="term_type_id" defaultValue={editItem.term_type_id ?? ""} className="input-terminal">
                <option value="">None</option>
                {termTypes?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-terminal !text-[#00ff41]">[SAVE]</button>
              <Link href="/admin/terms" className="btn-terminal">[CANCEL]</Link>
            </div>
          </form>
        </div>
      )}

      <form method="GET" className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#303030]" />
          <input name="q" defaultValue={query} placeholder="Search terms..." className="input-terminal pl-9 py-2" />
        </div>
        <button type="submit" className="btn-terminal">[SEARCH]</button>
        {query && <Link href="/admin/terms" className="btn-terminal !text-[#505050]">[CLEAR]</Link>}
      </form>

      <div className="terminal-card overflow-x-auto">
        <table className="table-admin">
          <thead><tr><th>ID</th><th>Term</th><th>Definition</th><th>Example</th><th>Priority</th><th>Type</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
            {rows?.map((r) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const tt = r.term_types as any;
              return (
                <tr key={r.id} className={editId === r.id ? "!bg-[#00d4ff]/5" : ""}>
                  <td className="text-[#00ff41]/50">{r.id}</td>
                  <td className="text-[#b0b0b0] font-bold">{r.term}</td>
                  <td className="max-w-[180px] truncate">{r.definition}</td>
                  <td className="max-w-[180px] truncate text-[#606060]">{r.example}</td>
                  <td className="tabular-nums">{r.priority}</td>
                  <td className="text-[#00d4ff] text-[10px]">{tt?.name || "\u2014"}</td>
                  <td className="text-[#404040] text-[10px] whitespace-nowrap">{new Date(r.created_datetime_utc).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-1.5">
                      <Link href={`/admin/terms?q=${query}&edit=${r.id}`} className="btn-terminal text-[10px]">[EDIT]</Link>
                      <form action={deleteTerm.bind(null, r.id)}><button type="submit" className="btn-terminal text-[10px] hover:!text-[#ff0033] hover:!border-[#ff0033]"><Trash2 size={11} /></button></form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {(!rows || rows.length === 0) && (
              <tr><td colSpan={8} className="text-center text-[#1a3a1a] py-10">No terms found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs">
          <p className="text-[#303030]">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && <Link href={`/admin/terms?q=${query}&page=${page - 1}`} className="btn-terminal flex items-center gap-1"><ChevronLeft size={12} /> Prev</Link>}
            {page < totalPages && <Link href={`/admin/terms?q=${query}&page=${page + 1}`} className="btn-terminal flex items-center gap-1">Next <ChevronRight size={12} /></Link>}
          </div>
        </div>
      )}
    </div>
  );
}
