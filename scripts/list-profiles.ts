import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv(): Record<string, string> {
  const raw = readFileSync(".env.local", "utf-8");
  const env: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i > -1) env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return env;
}

async function main() {
  const env = loadEnv();
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, is_superadmin")
    .limit(20);

  if (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log("No profiles found in the database.");
    return;
  }

  console.log(`\nFound ${data.length} profile(s):\n`);
  data.forEach((p) => {
    console.log(
      ` ${p.email || "(no email)"} | ${p.first_name ?? ""} ${p.last_name ?? ""} | superadmin: ${p.is_superadmin}`
    );
  });
}

main();
