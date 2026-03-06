import { createAdminClient } from "@/lib/supabase/admin";
import { updateHumorMix } from "../actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HumorMixPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const params = await searchParams;
  const editId = params.edit ? parseInt(params.edit) : null;
  const admin = createAdminClient();

  const { data: rows } = await admin
    .from("humor_flavor_mix")
    .select("id, caption_count, created_datetime_utc, humor_flavor_id, humor_flavors(slug)")
    .order("id", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[#00ff41] text-lg font-bold tracking-wider glow-text">HUMOR MIX</h1>
        <p className="text-[#252525] text-[10px] mt-1">{rows?.length ?? 0} mix entries</p>
      </div>

      {editId && rows?.find((r) => r.id === editId) && (() => {
        const item = rows.find((r) => r.id === editId)!;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const f = item.humor_flavors as any;
        return (
          <div className="terminal-card p-4">
            <h2 className="text-[#00d4ff] text-[10px] font-bold uppercase tracking-[0.15em] mb-3">
              Edit Mix #{editId} ({f?.slug})
            </h2>
            <form action={updateHumorMix.bind(null, editId)} className="flex items-end gap-3">
              <div>
                <label className="block text-[#404040] text-[9px] uppercase tracking-wider mb-1">Caption Count</label>
                <input name="caption_count" type="number" min="0" defaultValue={item.caption_count} className="input-terminal w-32" required />
              </div>
              <button type="submit" className="btn-terminal !text-[#00ff41]">[SAVE]</button>
              <Link href="/admin/humor-mix" className="btn-terminal">[CANCEL]</Link>
            </form>
          </div>
        );
      })()}

      <div className="terminal-card overflow-x-auto">
        <table className="table-admin">
          <thead><tr><th>ID</th><th>Humor Flavor</th><th>Caption Count</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
            {rows?.map((r) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const f = r.humor_flavors as any;
              return (
                <tr key={r.id} className={editId === r.id ? "!bg-[#00d4ff]/5" : ""}>
                  <td className="text-[#00ff41]/50">{r.id}</td>
                  <td className="text-[#00d4ff]">{f?.slug || "\u2014"}</td>
                  <td className="text-[#ffb000] tabular-nums">{r.caption_count}</td>
                  <td className="text-[#404040] text-[10px] whitespace-nowrap">{new Date(r.created_datetime_utc).toLocaleDateString()}</td>
                  <td>
                    <Link href={`/admin/humor-mix?edit=${r.id}`} className="btn-terminal text-[10px]">[EDIT]</Link>
                  </td>
                </tr>
              );
            })}
            {(!rows || rows.length === 0) && (
              <tr><td colSpan={5} className="text-center text-[#1a3a1a] py-10">No mix entries found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
