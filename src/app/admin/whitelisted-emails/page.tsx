import { createAdminClient } from "@/lib/supabase/admin";
import { createWhitelistedEmail, updateWhitelistedEmail, deleteWhitelistedEmail } from "../actions";
import Link from "next/link";
import { Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 25;

export default async function WhitelistedEmailsPage({
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
    .from("whitelist_email_addresses")
    .select("id, email_address, created_datetime_utc", { count: "exact" });
  if (query) q = q.ilike("email_address", `%${query}%`);

  const { data: rows, count } = await q
    .order("created_datetime_utc", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);
  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[#00ff41] text-lg font-bold tracking-wider glow-text">WHITELISTED EMAILS</h1>
        <p className="text-[#252525] text-[10px] mt-1">{count ?? 0} emails whitelisted</p>
      </div>

      <div className="terminal-card p-4">
        <h2 className="text-[#00ff41] text-[10px] font-bold uppercase tracking-[0.15em] mb-3">+ Add Email</h2>
        <form action={createWhitelistedEmail} className="flex items-end gap-3">
          <div className="flex-1 max-w-sm">
            <label className="block text-[#404040] text-[9px] uppercase tracking-wider mb-1">Email Address</label>
            <input name="email_address" type="email" className="input-terminal" placeholder="user@example.com" required />
          </div>
          <button type="submit" className="btn-terminal !text-[#00ff41]">[CREATE]</button>
        </form>
      </div>

      {editId && rows?.find((r) => r.id === editId) && (
        <div className="terminal-card p-4">
          <h2 className="text-[#00d4ff] text-[10px] font-bold uppercase tracking-[0.15em] mb-3">Edit Email #{editId}</h2>
          <form action={updateWhitelistedEmail.bind(null, editId)} className="flex items-end gap-3">
            <div className="flex-1 max-w-sm">
              <label className="block text-[#404040] text-[9px] uppercase tracking-wider mb-1">Email Address</label>
              <input name="email_address" type="email" defaultValue={rows.find((r) => r.id === editId)!.email_address} className="input-terminal" required />
            </div>
            <button type="submit" className="btn-terminal !text-[#00ff41]">[SAVE]</button>
            <Link href="/admin/whitelisted-emails" className="btn-terminal">[CANCEL]</Link>
          </form>
        </div>
      )}

      <form method="GET" className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#303030]" />
          <input name="q" defaultValue={query} placeholder="Search emails..." className="input-terminal pl-9 py-2" />
        </div>
        <button type="submit" className="btn-terminal">[SEARCH]</button>
        {query && <Link href="/admin/whitelisted-emails" className="btn-terminal !text-[#505050]">[CLEAR]</Link>}
      </form>

      <div className="terminal-card overflow-x-auto">
        <table className="table-admin">
          <thead><tr><th>ID</th><th>Email Address</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
            {rows?.map((r) => (
              <tr key={r.id} className={editId === r.id ? "!bg-[#00d4ff]/5" : ""}>
                <td className="text-[#00ff41]/50">{r.id}</td>
                <td className="text-[#b0b0b0]">{r.email_address}</td>
                <td className="text-[#404040] text-[10px] whitespace-nowrap">{new Date(r.created_datetime_utc).toLocaleDateString()}</td>
                <td>
                  <div className="flex gap-1.5">
                    <Link href={`/admin/whitelisted-emails?q=${query}&edit=${r.id}`} className="btn-terminal text-[10px]">[EDIT]</Link>
                    <form action={deleteWhitelistedEmail.bind(null, r.id)}><button type="submit" className="btn-terminal text-[10px] hover:!text-[#ff0033] hover:!border-[#ff0033]"><Trash2 size={11} /></button></form>
                  </div>
                </td>
              </tr>
            ))}
            {(!rows || rows.length === 0) && (
              <tr><td colSpan={4} className="text-center text-[#1a3a1a] py-10">No emails found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs">
          <p className="text-[#303030]">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && <Link href={`/admin/whitelisted-emails?q=${query}&page=${page - 1}`} className="btn-terminal flex items-center gap-1"><ChevronLeft size={12} /> Prev</Link>}
            {page < totalPages && <Link href={`/admin/whitelisted-emails?q=${query}&page=${page + 1}`} className="btn-terminal flex items-center gap-1">Next <ChevronRight size={12} /></Link>}
          </div>
        </div>
      )}
    </div>
  );
}
