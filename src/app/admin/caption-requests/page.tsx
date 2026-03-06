import { createAdminClient } from "@/lib/supabase/admin";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 25;

export default async function CaptionRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const offset = (page - 1) * PAGE_SIZE;
  const admin = createAdminClient();

  const { data: rows, count } = await admin
    .from("caption_requests")
    .select(
      "id, created_datetime_utc, profiles(first_name, last_name, email), images(url, image_description)",
      { count: "exact" }
    )
    .order("created_datetime_utc", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[#00ff41] text-lg font-bold tracking-wider glow-text">
          CAPTION REQUESTS
        </h1>
        <p className="text-[#252525] text-[10px] mt-1">{count ?? 0} requests logged</p>
      </div>

      <div className="terminal-card overflow-x-auto">
        <table className="table-admin">
          <thead>
            <tr><th>ID</th><th>Profile</th><th>Image</th><th>Image Desc</th><th>Created</th></tr>
          </thead>
          <tbody>
            {rows?.map((r) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const p = r.profiles as any;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const img = r.images as any;
              return (
                <tr key={r.id}>
                  <td className="text-[#00ff41]/50">{r.id}</td>
                  <td className="text-[#b0b0b0] whitespace-nowrap">
                    {p ? `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.email : "\u2014"}
                  </td>
                  <td>
                    {img?.url ? (
                      <img src={img.url} alt="" className="w-9 h-9 object-cover rounded border border-[#1a3a1a]" />
                    ) : (
                      <span className="text-[#2a2a2a] text-[10px]">N/A</span>
                    )}
                  </td>
                  <td className="max-w-[250px] truncate text-[11px]">{img?.image_description || "\u2014"}</td>
                  <td className="text-[#404040] text-[10px] whitespace-nowrap">
                    {new Date(r.created_datetime_utc).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
            {(!rows || rows.length === 0) && (
              <tr><td colSpan={5} className="text-center text-[#1a3a1a] py-10">No requests found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs">
          <p className="text-[#303030]">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && <Link href={`/admin/caption-requests?page=${page - 1}`} className="btn-terminal flex items-center gap-1"><ChevronLeft size={12} /> Prev</Link>}
            {page < totalPages && <Link href={`/admin/caption-requests?page=${page + 1}`} className="btn-terminal flex items-center gap-1">Next <ChevronRight size={12} /></Link>}
          </div>
        </div>
      )}
    </div>
  );
}
