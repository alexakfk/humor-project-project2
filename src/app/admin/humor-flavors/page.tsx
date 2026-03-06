import { createAdminClient } from "@/lib/supabase/admin";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 25;

export default async function HumorFlavorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const page = parseInt(params.page || "1");
  const offset = (page - 1) * PAGE_SIZE;
  const admin = createAdminClient();

  let q = admin
    .from("humor_flavors")
    .select("id, slug, description, created_datetime_utc", {
      count: "exact",
    });
  if (query) q = q.or(`slug.ilike.%${query}%,description.ilike.%${query}%`);

  const { data: rows, count } = await q
    .order("id", { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1);
  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[#00ff41] text-lg font-bold tracking-wider glow-text">
          HUMOR FLAVORS
        </h1>
        <p className="text-[#252525] text-[10px] mt-1">
          {count ?? 0} flavors registered
        </p>
      </div>

      <form method="GET" className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#303030]" />
          <input name="q" defaultValue={query} placeholder="Search slug or description..." className="input-terminal pl-9 py-2" />
        </div>
        <button type="submit" className="btn-terminal">[SEARCH]</button>
        {query && <Link href="/admin/humor-flavors" className="btn-terminal !text-[#505050]">[CLEAR]</Link>}
      </form>

      <div className="terminal-card overflow-x-auto">
        <table className="table-admin">
          <thead>
            <tr><th>ID</th><th>Slug</th><th>Description</th><th>Created</th></tr>
          </thead>
          <tbody>
            {rows?.map((r) => (
              <tr key={r.id}>
                <td className="text-[#00ff41]/50">{r.id}</td>
                <td className="text-[#00d4ff]">{r.slug}</td>
                <td className="max-w-[400px] truncate">{r.description || "\u2014"}</td>
                <td className="text-[#404040] text-[10px] whitespace-nowrap">
                  {new Date(r.created_datetime_utc).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {(!rows || rows.length === 0) && (
              <tr><td colSpan={4} className="text-center text-[#1a3a1a] py-10">No flavors found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs">
          <p className="text-[#303030]">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && <Link href={`/admin/humor-flavors?q=${query}&page=${page - 1}`} className="btn-terminal flex items-center gap-1"><ChevronLeft size={12} /> Prev</Link>}
            {page < totalPages && <Link href={`/admin/humor-flavors?q=${query}&page=${page + 1}`} className="btn-terminal flex items-center gap-1">Next <ChevronRight size={12} /></Link>}
          </div>
        </div>
      )}
    </div>
  );
}
