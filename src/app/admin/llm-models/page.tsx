import { createAdminClient } from "@/lib/supabase/admin";
import { createLlmModel, updateLlmModel, deleteLlmModel } from "../actions";
import Link from "next/link";
import { Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LlmModelsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const params = await searchParams;
  const editId = params.edit ? parseInt(params.edit) : null;
  const admin = createAdminClient();

  const [{ data: rows }, { data: providers }] = await Promise.all([
    admin
      .from("llm_models")
      .select("id, name, provider_model_id, is_temperature_supported, created_datetime_utc, llm_provider_id, llm_providers(name)")
      .order("id", { ascending: true }),
    admin.from("llm_providers").select("id, name").order("name"),
  ]);

  const editItem = editId ? rows?.find((r) => r.id === editId) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[#00ff41] text-lg font-bold tracking-wider glow-text">LLM MODELS</h1>
        <p className="text-[#252525] text-[10px] mt-1">{rows?.length ?? 0} models registered</p>
      </div>

      <div className="terminal-card p-4">
        <h2 className="text-[#00ff41] text-[10px] font-bold uppercase tracking-[0.15em] mb-3">+ Add Model</h2>
        <form action={createLlmModel} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-[#404040] text-[9px] uppercase tracking-wider mb-1">Name</label>
            <input name="name" className="input-terminal" placeholder="e.g. GPT-4o" required />
          </div>
          <div>
            <label className="block text-[#404040] text-[9px] uppercase tracking-wider mb-1">Provider</label>
            <select name="llm_provider_id" className="input-terminal" required>
              <option value="">Select...</option>
              {providers?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[#404040] text-[9px] uppercase tracking-wider mb-1">Provider Model ID</label>
            <input name="provider_model_id" className="input-terminal" placeholder="e.g. gpt-4o" required />
          </div>
          <div className="flex items-center pt-4">
            <label className="flex items-center gap-1.5 text-[11px] text-[#707070] cursor-pointer">
              <input type="checkbox" name="is_temperature_supported" className="accent-[#00ff41]" /> Temp Supported
            </label>
          </div>
          <button type="submit" className="btn-terminal !text-[#00ff41]">[CREATE]</button>
        </form>
      </div>

      {editItem && (
        <div className="terminal-card p-4">
          <h2 className="text-[#00d4ff] text-[10px] font-bold uppercase tracking-[0.15em] mb-3">Edit Model #{editId}</h2>
          <form action={updateLlmModel.bind(null, editId!)} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div>
              <label className="block text-[#404040] text-[9px] uppercase tracking-wider mb-1">Name</label>
              <input name="name" defaultValue={editItem.name} className="input-terminal" required />
            </div>
            <div>
              <label className="block text-[#404040] text-[9px] uppercase tracking-wider mb-1">Provider</label>
              <select name="llm_provider_id" defaultValue={editItem.llm_provider_id} className="input-terminal" required>
                {providers?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[#404040] text-[9px] uppercase tracking-wider mb-1">Provider Model ID</label>
              <input name="provider_model_id" defaultValue={editItem.provider_model_id} className="input-terminal" required />
            </div>
            <div className="flex items-center pt-4">
              <label className="flex items-center gap-1.5 text-[11px] text-[#707070] cursor-pointer">
                <input type="checkbox" name="is_temperature_supported" defaultChecked={editItem.is_temperature_supported} className="accent-[#00ff41]" /> Temp Supported
              </label>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-terminal !text-[#00ff41]">[SAVE]</button>
              <Link href="/admin/llm-models" className="btn-terminal">[CANCEL]</Link>
            </div>
          </form>
        </div>
      )}

      <div className="terminal-card overflow-x-auto">
        <table className="table-admin">
          <thead>
            <tr><th>ID</th><th>Name</th><th>Provider</th><th>Provider Model</th><th>Temp</th><th>Created</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {rows?.map((r) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const prov = r.llm_providers as any;
              return (
                <tr key={r.id} className={editId === r.id ? "!bg-[#00d4ff]/5" : ""}>
                  <td className="text-[#00ff41]/50">{r.id}</td>
                  <td className="text-[#b0b0b0]">{r.name}</td>
                  <td className="text-[#00d4ff]">{prov?.name || "\u2014"}</td>
                  <td className="text-[#707070] text-[11px]">{r.provider_model_id}</td>
                  <td><span className={r.is_temperature_supported ? "badge-on" : "badge-off"}>{r.is_temperature_supported ? "YES" : "NO"}</span></td>
                  <td className="text-[#404040] text-[10px] whitespace-nowrap">{new Date(r.created_datetime_utc).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-1.5">
                      <Link href={`/admin/llm-models?edit=${r.id}`} className="btn-terminal text-[10px]">[EDIT]</Link>
                      <form action={deleteLlmModel.bind(null, r.id)}><button type="submit" className="btn-terminal text-[10px] hover:!text-[#ff0033] hover:!border-[#ff0033]"><Trash2 size={11} /></button></form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {(!rows || rows.length === 0) && (
              <tr><td colSpan={7} className="text-center text-[#1a3a1a] py-10">No models found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
