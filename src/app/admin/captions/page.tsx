import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 25;
const MAX_VOTE_ROWS = 10000;

function getCaptionId(vote: Record<string, unknown>) {
  if (vote.caption_id) return String(vote.caption_id);
  const fallbackCaptionKey = Object.keys(vote).find(
    (key) => key.toLowerCase().includes("caption") && key.toLowerCase().endsWith("_id")
  );
  return fallbackCaptionKey ? String(vote[fallbackCaptionKey]) : null;
}

function getVoteValue(vote: Record<string, unknown>) {
  if (typeof vote.vote_value === "number") return vote.vote_value;
  if (typeof vote.vote_value === "string") {
    const parsed = Number(vote.vote_value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return null;
}

export default async function CaptionsPage({
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
    .from("captions")
    .select(
      "id, content, is_public, is_featured, like_count, created_datetime_utc, profiles:profiles!captions_profile_id_fkey(first_name, last_name, email), images:images!captions_image_id_fkey(url, image_description), humor_flavors:humor_flavors!captions_humor_flavor_id_fkey(slug)",
      { count: "exact" }
    );
  if (query) q = q.ilike("content", `%${query}%`);

  const { data: rows, count } = await q
    .order("created_datetime_utc", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);
  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  const { data: voteRows } = await admin
    .from("caption_votes")
    .select("*")
    .limit(MAX_VOTE_ROWS);

  const voteData = (voteRows ?? []) as Record<string, unknown>[];
  const ratedCaptionIds = new Set<string>();
  const voteDistribution: Record<string, number> = {};
  const captionVoteStats: Record<
    string,
    { count: number; sum: number; min: number; max: number }
  > = {};
  let totalVoteValue = 0;
  let numericVoteCount = 0;

  voteData.forEach((vote) => {
    const captionId = getCaptionId(vote);
    if (captionId) ratedCaptionIds.add(captionId);

    const voteValue = getVoteValue(vote);
    if (voteValue !== null) {
      const bucket = String(voteValue);
      voteDistribution[bucket] = (voteDistribution[bucket] || 0) + 1;
      totalVoteValue += voteValue;
      numericVoteCount++;

      if (captionId) {
        const current =
          captionVoteStats[captionId] ?? {
            count: 0,
            sum: 0,
            min: voteValue,
            max: voteValue,
          };
        current.count += 1;
        current.sum += voteValue;
        current.min = Math.min(current.min, voteValue);
        current.max = Math.max(current.max, voteValue);
        captionVoteStats[captionId] = current;
      }
    }
  });

  const sortedDistribution = Object.entries(voteDistribution)
    .map(([value, count]) => ({ value: Number(value), count }))
    .sort((a, b) => a.value - b.value);
  const maxDistributionCount = Math.max(...sortedDistribution.map((d) => d.count), 1);
  const mostCommonVote = sortedDistribution.reduce(
    (best, current) => (current.count > best.count ? current : best),
    { value: 0, count: 0 }
  );

  const topDiscussedCaptionEntries = Object.entries(captionVoteStats)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 8);
  const topDiscussedCaptionIds = topDiscussedCaptionEntries.map(([id]) => id);
  const { data: topDiscussedCaptions } = topDiscussedCaptionIds.length
    ? await admin
        .from("captions")
        .select(
          "id, content, like_count, profiles:profiles!captions_profile_id_fkey(first_name, last_name, email)"
        )
        .in("id", topDiscussedCaptionIds)
    : { data: [] as unknown[] };

  const topDiscussedCaptionMap = new Map(
    (topDiscussedCaptions ?? []).map((caption) => [String(caption.id), caption])
  );
  const averageVote = numericVoteCount > 0 ? totalVoteValue / numericVoteCount : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[#00ff41] text-lg font-bold tracking-wider glow-text">
          CAPTION ARCHIVES
        </h1>
        <p className="text-[#252525] text-[10px] mt-1">{count ?? 0} captions in database</p>
      </div>

      <form method="GET" className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#303030]" />
          <input name="q" defaultValue={query} placeholder="Search caption content..." className="input-terminal pl-9 py-2" />
        </div>
        <button type="submit" className="btn-terminal">[SEARCH]</button>
        {query && <Link href="/admin/captions" className="btn-terminal !text-[#505050]">[CLEAR]</Link>}
      </form>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="terminal-card p-3">
          <p className="text-[#404040] text-[9px] uppercase tracking-[0.15em] mb-1">Total Caption Votes</p>
          <p className="text-[#00d4ff] text-xl font-bold">{voteData.length.toLocaleString()}</p>
        </div>
        <div className="terminal-card p-3">
          <p className="text-[#404040] text-[9px] uppercase tracking-[0.15em] mb-1">Average Vote</p>
          <p className="text-[#00ff41] text-xl font-bold">{averageVote.toFixed(2)}</p>
        </div>
        <div className="terminal-card p-3">
          <p className="text-[#404040] text-[9px] uppercase tracking-[0.15em] mb-1">Captions Rated</p>
          <p className="text-[#ffb000] text-xl font-bold">{ratedCaptionIds.size.toLocaleString()}</p>
        </div>
        <div className="terminal-card p-3">
          <p className="text-[#404040] text-[9px] uppercase tracking-[0.15em] mb-1">Most Common Vote</p>
          <p className="text-[#ff66cc] text-xl font-bold">
            {mostCommonVote.count > 0 ? mostCommonVote.value : "N/A"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="terminal-card p-4">
          <h2 className="text-[#00ff41] text-[11px] font-bold uppercase tracking-[0.15em] mb-3">
            Vote Spectrum
          </h2>
          <div className="space-y-2">
            {sortedDistribution.length > 0 ? (
              sortedDistribution.map((entry) => (
                <div key={entry.value}>
                  <div className="flex items-center justify-between text-[10px] text-[#606060] mb-1">
                    <span>Vote {entry.value}</span>
                    <span className="tabular-nums">{entry.count.toLocaleString()}</span>
                  </div>
                  <div className="h-2 w-full bg-[#0d160d] rounded overflow-hidden">
                    <div
                      className="h-full bg-[#00ff41]/60"
                      style={{ width: `${(entry.count / maxDistributionCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[#1a3a1a] text-[11px]">No vote distribution data yet.</p>
            )}
          </div>
        </div>

        <div className="terminal-card p-4">
          <h2 className="text-[#00ff41] text-[11px] font-bold uppercase tracking-[0.15em] mb-3">
            Caption Pulse (Most Discussed)
          </h2>
          <div className="space-y-2">
            {topDiscussedCaptionEntries.length > 0 ? (
              topDiscussedCaptionEntries.map(([captionId, stat], index) => {
                const caption = topDiscussedCaptionMap.get(captionId) as
                | {
                    content: string | null;
                    like_count: number | null;
                    profiles: { first_name: string | null; last_name: string | null; email: string | null } | null;
                  }
                | undefined;
              const profile = caption?.profiles;
              const authorLabel = profile
                ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email || "Unknown"
                : "Unknown";
              const avg = stat.count > 0 ? stat.sum / stat.count : 0;
              return (
                <div
                  key={captionId}
                  className="border border-[#1a3a1a]/40 rounded-sm p-2.5 text-[11px]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[#707070]">
                      <span className="text-[#00ff41]/50 mr-2">
                        #{String(index + 1).padStart(2, "0")}
                      </span>
                      {caption?.content || "Caption content unavailable"}
                    </p>
                    <p className="text-[#00ff41] whitespace-nowrap tabular-nums">
                      {stat.count} vote{stat.count === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="mt-1 text-[10px] text-[#3f3f3f] flex items-center justify-between gap-2">
                    <span className="truncate">{authorLabel}</span>
                    <span className="tabular-nums">
                      Avg {avg.toFixed(2)} (range {stat.min} to {stat.max}) | Likes {(caption?.like_count ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-[#1a3a1a] text-[11px]">
              No caption vote activity yet.
            </p>
          )}
          </div>
        </div>
      </div>

      <div className="terminal-card overflow-x-auto">
        <table className="table-admin">
          <thead>
            <tr>
              <th>Content</th><th>Author</th><th>Flavor</th>
              <th>Public</th><th>Featured</th><th>Likes</th><th>Created</th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((c) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const p = c.profiles as any;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const f = c.humor_flavors as any;
              return (
                <tr key={c.id}>
                  <td className="max-w-[280px]">
                    <p className="text-[#b0b0b0] truncate text-[11px]">{c.content || "\u2014"}</p>
                  </td>
                  <td className="text-[#505050] text-[10px] whitespace-nowrap">
                    {p ? `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.email : "\u2014"}
                  </td>
                  <td>
                    {f?.slug ? <span className="text-[#00d4ff] text-[10px]">{f.slug}</span> : <span className="text-[#2a2a2a] text-[10px]">{"\u2014"}</span>}
                  </td>
                  <td><span className={c.is_public ? "badge-on" : "badge-off"}>{c.is_public ? "YES" : "NO"}</span></td>
                  <td><span className={c.is_featured ? "badge-on" : "badge-off"}>{c.is_featured ? "YES" : "NO"}</span></td>
                  <td className="text-[#ffb000] text-[11px] tabular-nums">{c.like_count}</td>
                  <td className="text-[#404040] text-[10px] whitespace-nowrap">
                    {new Date(c.created_datetime_utc).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
            {(!rows || rows.length === 0) && (
              <tr><td colSpan={7} className="text-center text-[#1a3a1a] py-10">No captions found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs">
          <p className="text-[#303030]">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && <Link href={`/admin/captions?q=${query}&page=${page - 1}`} className="btn-terminal flex items-center gap-1"><ChevronLeft size={12} /> Prev</Link>}
            {page < totalPages && <Link href={`/admin/captions?q=${query}&page=${page + 1}`} className="btn-terminal flex items-center gap-1">Next <ChevronRight size={12} /></Link>}
          </div>
        </div>
      )}
    </div>
  );
}
