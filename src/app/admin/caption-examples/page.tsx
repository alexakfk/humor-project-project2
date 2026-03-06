import { createAdminClient } from "@/lib/supabase/admin";
import { createCaptionExample, updateCaptionExample, deleteCaptionExample } from "../actions";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;

export default async function CaptionExamplesPage({
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

  let q = admin
    .from("caption_examples")
    .select("id, image_description, caption, explanation, priority, image_id, created_datetime_utc", { count: "exact" });
  if (query) q = q.or(`image_description.ilike.%${query}%,caption.ilike.%${query}%`);

  const { data: rows, count } = await q
    .order("created_datetime_utc", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);
  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);
  const editItem = editId ? rows?.find((r) => r.id === editId) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[#00ff41] text-lg font-bold tracking-wider glow-text">CAPTION EXAMPLES</h1>
        <p className="text-[#252525] text-[10px] mt-1">{count ?? 0} examples stored</p>
      </div>

      <div className="terminal-card p-4">
        <h2 className="text-[#00ff41] text-[10px] font-bold uppercase tracking-[0.15em] mb-3">+ Add Example</h2>
        <form action={createCaptionExample} className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
          <div>
            <label className="block text-[#404040] text-[9px] uppercase tracking-wider mb-1">Image Description</label>
            <textarea name="image_description" rows={2} className="input-terminal" required />
          </div>
          <div>
            <label className="block text-[#404040] text-[9px] uppercase tracking-wider mb-1">Caption</label>
            <textarea name="caption" rows={2} className="input-terminal" required />
          </div>
          <div>
            <label className="block text-[#404040] text-[9px] uppercase tracking-wider mb-1">Explanation</label>
            <textarea name="explanation" rows={2} className="input-terminal" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#404040] text-[9px] uppercase tracking-wider mb-1">Priority</label>
              <input name="priority" type="number" defaultValue="0" className="input-terminal" />
            </div>
            <div>
              <label className="block text-[#404040] text-[9px] uppercase tracking-wider mb-1">Image ID (UUID)</label>
              <input name="image_id" className="input-terminal" placeholder="optional" />
            </div>
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="btn-terminal !text-[#00ff41]">[CREATE]</button>
          </div>
        </form>
      </div>

      {editItem && (
        <div className="terminal-card p-4">
          <h2 className="text-[#00d4ff] text-[10px] font-bold uppercase tracking-[0.15em] mb-3">Edit Example #{editId}</h2>
          <form action={updateCaptionExample.bind(null, editId!)} className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-[#404040] text-[9px] uppercase tracking-wider mb-1">Image Description</label>
              <textarea name="image_description" rows={2} defaultValue={editItem.image_description} className="input-terminal" required />
            </div>
            <div>
              <label className="block text-[#404040] text-[9px] uppercase tracking-wider mb-1">Caption</label>
              <textarea name="caption" rows={2} defaultValue={editItem.caption} className="input-terminal" required />
            </div>
            <div>
              <label className="block text-[#404040] text-[9px] uppercase tracking-wider mb-1">Explanation</label>
              <textarea name="explanation" rows={2} defaultValue={editItem.explanation} className="input-terminal" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#404040] text-[9px] uppercase tracking-wider mb-1">Priority</label>
                <input name="priority" type="number" defaultValue={editItem.priority} className="input-terminal" />
              </div>
              <div>
                <label className="block text-[#404040] text-[9px] uppercase tracking-wider mb-1">Image ID (UUID)</label>
                <input name="image_id" defaultValue={editItem.image_id ?? ""} className="input-terminal" />
              </div>
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="btn-terminal !text-[#00ff41]">[SAVE]</button>
              <Link href="/admin/caption-examples" className="btn-terminal">[CANCEL]</Link>
            </div>
          </form>
        </div>
      )}

      <form method="GET" className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#303030]" />
          <input name="q" defaultValue={query} placeholder="Search description or caption..." className="input-terminal pl-9 py-2" />
        </div>
        <button type="submit" className="btn-terminal">[SEARCH]</button>
        {query && <Link href="/admin/caption-examples" className="btn-terminal !text-[#505050]">[CLEAR]</Link>}
      </form>

      <div className="terminal-card overflow-x-auto">
        <table className="table-admin">
          <thead><tr><th>ID</th><th>Image Description</th><th>Caption</th><th>Explanation</th><th>Priority</th><th>Image</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
            {rows?.map((r) => (
              <tr key={r.id} className={editId === r.id ? "!bg-[#00d4ff]/5" : ""}>
                <td className="text-[#00ff41]/50">{r.id}</td>
                <td className="max-w-[160px] truncate">{r.image_description}</td>
                <td className="max-w-[160px] truncate text-[#b0b0b0]">{r.caption}</td>
                <td className="max-w-[140px] truncate text-[#606060]">{r.explanation}</td>
                <td className="tabular-nums">{r.priority}</td>
                <td className="text-[10px] text-[#505050] max-w-[80px] truncate">{r.image_id ? r.image_id.slice(0, 8) + "..." : "\u2014"}</td>
                <td className="text-[#404040] text-[10px] whitespace-nowrap">{new Date(r.created_datetime_utc).toLocaleDateString()}</td>
                <td>
                  <div className="flex gap-1.5">
                    <Link href={`/admin/caption-examples?q=${query}&edit=${r.id}`} className="btn-terminal text-[10px]">[EDIT]</Link>
                    <form action={deleteCaptionExample.bind(null, r.id)}><button type="submit" className="btn-terminal text-[10px] hover:!text-[#ff0033] hover:!border-[#ff0033]"><Trash2 size={11} /></button></form>
                  </div>
                </td>
              </tr>
            ))}
            {(!rows || rows.length === 0) && (
              <tr><td colSpan={8} className="text-center text-[#1a3a1a] py-10">No examples found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs">
          <p className="text-[#303030]">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && <Link href={`/admin/caption-examples?q=${query}&page=${page - 1}`} className="btn-terminal flex items-center gap-1"><ChevronLeft size={12} /> Prev</Link>}
            {page < totalPages && <Link href={`/admin/caption-examples?q=${query}&page=${page + 1}`} className="btn-terminal flex items-center gap-1">Next <ChevronRight size={12} /></Link>}
          </div>
        </div>
      )}
    </div>
  );
}
