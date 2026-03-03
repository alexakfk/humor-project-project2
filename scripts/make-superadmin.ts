import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv(): Record<string, string> {
  try {
    const raw = readFileSync(".env.local", "utf-8");
    const env: Record<string, string> = {};
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
    }
    return env;
  } catch {
    console.error("ERROR: Could not read .env.local");
    process.exit(1);
  }
}

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║  HUMOR OPS // SUPERADMIN BOOTSTRAP UTILITY               ║
╚═══════════════════════════════════════════════════════════╝

Usage:  npx tsx scripts/make-superadmin.ts <email>

Sets is_superadmin=TRUE for the profile matching the given
email address. Uses the service role key to bypass RLS.

Requirements:
  - .env.local with NEXT_PUBLIC_SUPABASE_URL and
    SUPABASE_SERVICE_ROLE_KEY configured
  - The email must belong to an existing user with a profile
`);
    process.exit(1);
  }

  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error(
      "ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`\n> Looking up profile for: ${email}`);

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, is_superadmin")
    .eq("email", email)
    .single();

  if (error) {
    console.error(`ERROR: ${error.message}`);
    if (error.message.includes("API key"))
      console.error(
        "Check that SUPABASE_SERVICE_ROLE_KEY in .env.local is the full JWT (not the project ref)."
      );
    process.exit(1);
  }

  if (!profile) {
    console.error(`ERROR: No profile found for email: ${email}`);
    console.error("Make sure the user has signed up and has a profile record.");
    process.exit(1);
  }

  if (profile.is_superadmin) {
    console.log(
      `> ${profile.first_name} ${profile.last_name} is already a superadmin.`
    );
    process.exit(0);
  }

  console.log(
    `> Found: ${profile.first_name} ${profile.last_name} (${profile.id})`
  );
  console.log("> Setting is_superadmin = TRUE...");

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      is_superadmin: true,
      modified_datetime_utc: new Date().toISOString(),
    })
    .eq("id", profile.id);

  if (updateError) {
    console.error("ERROR: Failed to update profile:", updateError.message);
    process.exit(1);
  }

  console.log(
    `\n  SUCCESS: ${profile.first_name} ${profile.last_name} is now a superadmin!`
  );
  console.log("  You can now log in at /login\n");
}

main();
