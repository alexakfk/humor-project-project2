import { createAdminClient } from "@/lib/supabase/admin";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 25;

export default async function HumorFlavorStepsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const offset = (page - 1) * PAGE_SIZE;
  const admin = createAdminClient();

  const { data: rows, count } = await admin
    .from("humor_flavor_steps")
    .select(
      "id, order_by, llm_temperature, description, created_datetime_utc, humor_flavors(slug), humor_flavor_step_types(slug), llm_models(name), llm_input_types(slug), llm_output_types(slug)",
      { count: "exact" }
    )
    .order("humor_flavor_id", { ascending: true })
    .order("order_by", { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1);

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[#00ff41] text-lg font-bold tracking-wider glow-text">
          HUMOR FLAVOR STEPS
        </h1>
        <p className="text-[#252525] text-[10px] mt-1">{count ?? 0} steps configured</p>
      </div>

      <div className="terminal-card overflow-x-auto">
        <table className="table-admin">
          <thead>
            <tr>
              <th>ID</th><th>Flavor</th><th>Order</th><th>Step Type</th>
              <th>Model</th><th>Input</th><th>Output</th><th>Temp</th>
              <th>Description</th><th>Created</th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((r) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const f = r.humor_flavors as any;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const st = r.humor_flavor_step_types as any;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const m = r.llm_models as any;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const inp = r.llm_input_types as any;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const out = r.llm_output_types as any;
              return (
                <tr key={r.id}>
                  <td className="text-[#00ff41]/50">{r.id}</td>
                  <td className="text-[#00d4ff]">{f?.slug || "\u2014"}</td>
                  <td className="text-center">{r.order_by}</td>
                  <td>{st?.slug || "\u2014"}</td>
                  <td>{m?.name || "\u2014"}</td>
                  <td className="text-[10px]">{inp?.slug || "\u2014"}</td>
                  <td className="text-[10px]">{out?.slug || "\u2014"}</td>
                  <td className="text-[#ffb000] tabular-nums">{r.llm_temperature ?? "\u2014"}</td>
                  <td className="max-w-[180px] truncate">{r.description || "\u2014"}</td>
                  <td className="text-[#404040] text-[10px] whitespace-nowrap">
                    {new Date(r.created_datetime_utc).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
            {(!rows || rows.length === 0) && (
              <tr><td colSpan={10} className="text-center text-[#1a3a1a] py-10">No steps found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs">
          <p className="text-[#303030]">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && <Link href={`/admin/humor-flavor-steps?page=${page - 1}`} className="btn-terminal flex items-center gap-1"><ChevronLeft size={12} /> Prev</Link>}
            {page < totalPages && <Link href={`/admin/humor-flavor-steps?page=${page + 1}`} className="btn-terminal flex items-center gap-1">Next <ChevronRight size={12} /></Link>}
          </div>
        </div>
      )}
    </div>
  );
}
