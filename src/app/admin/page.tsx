import { createAdminClient } from "@/lib/supabase/admin";
import { ActivityChart, FlavorChart, SharesChart } from "./components/charts";

export const dynamic = "force-dynamic";

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="terminal-card p-4">
      <p className="text-[#404040] text-[9px] uppercase tracking-[0.15em] mb-2">
        {label}
      </p>
      <p className="stat-number" style={accent ? { color: accent, textShadow: `0 0 12px ${accent}` } : undefined}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {sub && <p className="text-[#2a2a2a] text-[9px] mt-1">{sub}</p>}
    </div>
  );
}

export default async function DashboardPage() {
  const admin = createAdminClient();

  const [
    profilesRes,
    imagesRes,
    captionsRes,
    likesRes,
    votesRes,
    sharesRes,
    bugsRes,
    requestsRes,
    llmResponsesRes,
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("images").select("*", { count: "exact", head: true }),
    admin.from("captions").select("*", { count: "exact", head: true }),
    admin.from("caption_likes").select("*", { count: "exact", head: true }),
    admin.from("caption_votes").select("*", { count: "exact", head: true }),
    admin.from("shares").select("*", { count: "exact", head: true }),
    admin.from("bug_reports").select("*", { count: "exact", head: true }),
    admin.from("caption_requests").select("*", { count: "exact", head: true }),
    admin
      .from("llm_model_responses")
      .select("*", { count: "exact", head: true }),
  ]);

  const counts = {
    profiles: profilesRes.count ?? 0,
    images: imagesRes.count ?? 0,
    captions: captionsRes.count ?? 0,
    likes: likesRes.count ?? 0,
    votes: votesRes.count ?? 0,
    shares: sharesRes.count ?? 0,
    bugs: bugsRes.count ?? 0,
    requests: requestsRes.count ?? 0,
    llmResponses: llmResponsesRes.count ?? 0,
  };

  // Caption activity over last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: recentCaptions } = await admin
    .from("captions")
    .select("created_datetime_utc")
    .gte("created_datetime_utc", thirtyDaysAgo.toISOString())
    .order("created_datetime_utc", { ascending: true })
    .limit(5000);

  const activityMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    activityMap[d.toISOString().split("T")[0]] = 0;
  }
  recentCaptions?.forEach((c) => {
    const day = new Date(c.created_datetime_utc).toISOString().split("T")[0];
    if (activityMap[day] !== undefined) activityMap[day]++;
  });
  const activityData = Object.entries(activityMap).map(([date, count]) => ({
    date: date.slice(5),
    count,
  }));

  // Humor flavor distribution
  const { data: flavors } = await admin
    .from("humor_flavors")
    .select("id, slug");
  const { data: captionFlavors } = await admin
    .from("captions")
    .select("humor_flavor_id")
    .not("humor_flavor_id", "is", null)
    .limit(10000);

  const flavorCounts: Record<string, number> = {};
  flavors?.forEach((f) => (flavorCounts[f.slug] = 0));
  captionFlavors?.forEach((c) => {
    const flavor = flavors?.find((f) => f.id === c.humor_flavor_id);
    if (flavor) flavorCounts[flavor.slug]++;
  });
  const flavorData = Object.entries(flavorCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Top users by caption count
  const { data: captionAuthors } = await admin
    .from("captions")
    .select("profile_id, profiles(first_name, last_name, email)")
    .limit(10000);

  const userCounts: Record<
    string,
    { name: string; email: string; count: number }
  > = {};
  captionAuthors?.forEach((c) => {
    const pid = c.profile_id;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = c.profiles as any;
    if (!userCounts[pid]) {
      userCounts[pid] = {
        name:
          `${p?.first_name || ""} ${p?.last_name || ""}`.trim() || "Unknown",
        email: p?.email || "",
        count: 0,
      };
    }
    userCounts[pid].count++;
  });
  const topUsers = Object.values(userCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Share destination breakdown
  const { data: shareRows } = await admin
    .from("shares")
    .select("share_to_destination_id, share_to_destinations(name)")
    .not("share_to_destination_id", "is", null)
    .limit(10000);

  const shareCounts: Record<string, number> = {};
  shareRows?.forEach((s) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dest = (s.share_to_destinations as any)?.name || "Unknown";
    shareCounts[dest] = (shareCounts[dest] || 0) + 1;
  });
  const sharesChartData = Object.entries(shareCounts).map(([name, value]) => ({
    name,
    value,
  }));

  // LLM model usage stats
  const { data: llmRows } = await admin
    .from("llm_model_responses")
    .select("llm_model_id, processing_time_seconds, llm_models(name)")
    .limit(10000);

  const modelStats: Record<
    string,
    { name: string; count: number; totalTime: number }
  > = {};
  llmRows?.forEach((r) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const model = (r.llm_models as any)?.name || "Unknown";
    if (!modelStats[model])
      modelStats[model] = { name: model, count: 0, totalTime: 0 };
    modelStats[model].count++;
    modelStats[model].totalTime += r.processing_time_seconds || 0;
  });
  const modelData = Object.values(modelStats).sort(
    (a, b) => b.count - a.count
  );
  const maxModelCount = Math.max(...modelData.map((m) => m.count), 1);

  // Recent bug reports
  const { data: recentBugs } = await admin
    .from("bug_reports")
    .select("id, subject, created_datetime_utc, profiles(first_name, last_name)")
    .order("created_datetime_utc", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[#00ff41] text-lg font-bold tracking-wider glow-text">
          SYSTEM DASHBOARD
        </h1>
        <p className="text-[#252525] text-[10px] mt-1">
          Real-time intelligence feed // {new Date().toISOString().replace("T", " ").slice(0, 19)} UTC
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatCard label="Agents" value={counts.profiles} sub="registered profiles" />
        <StatCard label="Images" value={counts.images} sub="in registry" />
        <StatCard label="Captions" value={counts.captions} sub="generated" accent="#00ff41" />
        <StatCard label="Likes" value={counts.likes} sub="engagements" accent="#00d4ff" />
        <StatCard label="Votes" value={counts.votes} sub="quality ratings" />
        <StatCard label="Shares" value={counts.shares} sub="distributed" />
        <StatCard label="Bug Intel" value={counts.bugs} sub="reports filed" accent="#ff0033" />
        <StatCard label="Requests" value={counts.requests} sub="caption requests" />
        <StatCard label="LLM Calls" value={counts.llmResponses} sub="model responses" accent="#ffb000" />
        <div className="terminal-card p-4 flex flex-col justify-center">
          <p className="text-[#404040] text-[9px] uppercase tracking-[0.15em] mb-2">
            Hit Rate
          </p>
          <p className="stat-number text-[#00d4ff]" style={{ textShadow: "0 0 12px #00d4ff" }}>
            {counts.requests > 0
              ? ((counts.captions / counts.requests) * 100).toFixed(1)
              : "0.0"}
            %
          </p>
          <p className="text-[#2a2a2a] text-[9px] mt-1">captions/request</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="terminal-card p-5">
          <h2 className="text-[#00ff41] text-[10px] font-bold uppercase tracking-[0.15em] mb-4">
            Neural Activity // Caption Generation (30d)
          </h2>
          <ActivityChart data={activityData} />
        </div>

        <div className="terminal-card p-5">
          <h2 className="text-[#00ff41] text-[10px] font-bold uppercase tracking-[0.15em] mb-4">
            Humor Genome Map
          </h2>
          {flavorData.length > 0 ? (
            <FlavorChart data={flavorData} />
          ) : (
            <div className="h-[160px] flex items-center justify-center text-[#1a3a1a] text-xs">
              No flavor data detected
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Users */}
        <div className="terminal-card p-5">
          <h2 className="text-[#00ff41] text-[10px] font-bold uppercase tracking-[0.15em] mb-4">
            Top Operatives
          </h2>
          <div className="space-y-2">
            {topUsers.length > 0 ? (
              topUsers.map((user, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-[11px]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[#00ff41]/40 w-5 text-right shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[#707070] truncate">
                      {user.name || user.email}
                    </span>
                  </div>
                  <span className="text-[#00ff41] tabular-nums shrink-0 ml-2">
                    {user.count}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-[#1a3a1a] text-xs">No operative data</p>
            )}
          </div>
        </div>

        {/* Share Intelligence */}
        <div className="terminal-card p-5">
          <h2 className="text-[#00ff41] text-[10px] font-bold uppercase tracking-[0.15em] mb-4">
            Share Intelligence
          </h2>
          {sharesChartData.length > 0 ? (
            <>
              <SharesChart data={sharesChartData} />
              <div className="mt-2 space-y-1">
                {sharesChartData.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px]">
                    <div
                      className="w-2 h-2 rounded-sm shrink-0"
                      style={{
                        backgroundColor:
                          [
                            "#00ff41",
                            "#00d4ff",
                            "#ffb000",
                            "#ff0033",
                            "#8b5cf6",
                            "#06b6d4",
                          ][i % 6],
                      }}
                    />
                    <span className="text-[#505050] truncate">{s.name}</span>
                    <span className="text-[#606060] ml-auto tabular-nums">
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-[#1a3a1a] text-xs">
              No share data detected
            </div>
          )}
        </div>

        {/* LLM Ops */}
        <div className="terminal-card p-5">
          <h2 className="text-[#00ff41] text-[10px] font-bold uppercase tracking-[0.15em] mb-4">
            LLM Ops Console
          </h2>
          <div className="space-y-3">
            {modelData.length > 0 ? (
              modelData.map((model, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#707070] truncate max-w-[140px]">
                      {model.name}
                    </span>
                    <span className="text-[#00d4ff] tabular-nums">
                      {model.count.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-[#0a0a0a] rounded overflow-hidden">
                    <div
                      className="h-full bg-[#00d4ff]/50 rounded"
                      style={{
                        width: `${(model.count / maxModelCount) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-[#2a2a2a] text-[9px]">
                    avg {model.count > 0 ? (model.totalTime / model.count).toFixed(1) : "0"}s
                    per call
                  </p>
                </div>
              ))
            ) : (
              <p className="text-[#1a3a1a] text-xs">No LLM data</p>
            )}
          </div>
        </div>
      </div>

      {/* Bug Reports */}
      <div className="terminal-card p-5">
        <h2 className="text-[#ff0033] text-[10px] font-bold uppercase tracking-[0.15em] mb-4">
          Recent Bug Intel
        </h2>
        <div className="space-y-2">
          {recentBugs && recentBugs.length > 0 ? (
            recentBugs.map((bug) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const p = bug.profiles as any;
              return (
                <div
                  key={bug.id}
                  className="flex items-center justify-between text-[11px] py-1 border-b border-[#1a3a1a]/20 last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[#ff0033]/60 text-[9px]">
                      #{bug.id}
                    </span>
                    <span className="text-[#808080] truncate">
                      {bug.subject || "No subject"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <span className="text-[#404040] text-[9px]">
                      {p ? `${p.first_name || ""} ${p.last_name || ""}`.trim() : ""}
                    </span>
                    <span className="text-[#2a2a2a] text-[9px] tabular-nums">
                      {new Date(bug.created_datetime_utc).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-[#1a3a1a] text-xs">
              No bugs reported — systems nominal
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
