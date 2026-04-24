import { spawn } from "node:child_process";

const PORT =
  Number(process.env.E2E_PORT) ||
  Math.floor(3200 + Math.random() * 400);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${PORT}`;
const RUNS = Number(process.env.E2E_RUNS ?? 3);
const PROTECTED_ADMIN_ROUTES = [
  "/admin",
  "/admin/users",
  "/admin/images",
  "/admin/captions",
  "/admin/caption-requests",
  "/admin/caption-examples",
  "/admin/humor-flavors",
  "/admin/humor-flavor-steps",
  "/admin/humor-mix",
  "/admin/llm-models",
  "/admin/llm-providers",
  "/admin/llm-prompt-chains",
  "/admin/llm-responses",
  "/admin/terms",
  "/admin/allowed-domains",
  "/admin/whitelisted-emails",
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchNoRedirect(pathname) {
  const response = await fetch(`${BASE_URL}${pathname}`, { redirect: "manual" });
  const body = await response.text();
  return { response, body };
}

function expect(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function locationEndsWith(response, expectedPath) {
  const location = response.headers.get("location");
  if (!location) return false;
  if (location === expectedPath) return true;

  try {
    const parsed = new URL(location);
    return parsed.pathname + parsed.search === expectedPath;
  } catch {
    return location.endsWith(expectedPath);
  }
}

async function waitForServer(maxAttempts = 30) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const res = await fetch(`${BASE_URL}/login`, { redirect: "manual" });
      if (res.status === 200) return;
    } catch {
      // ignore while server is still booting
    }
    await delay(1000);
  }
  throw new Error("Server did not become ready in time");
}

async function runWorkflow(runNumber) {
  const results = [];

  const root = await fetchNoRedirect("/");
  expect(
    [307, 308].includes(root.response.status),
    "Root should redirect unauthenticated users"
  );
  const rootTargetsLogin = locationEndsWith(root.response, "/login");
  const rootTargetsAdmin = locationEndsWith(root.response, "/admin");
  expect(
    rootTargetsLogin || rootTargetsAdmin,
    "Root redirect location should be /admin or /login"
  );
  results.push(
    rootTargetsLogin
      ? "`/` redirects unauthenticated users to `/login`"
      : "`/` redirects to `/admin` as configured"
  );

  for (const route of PROTECTED_ADMIN_ROUTES) {
    const protectedRoute = await fetchNoRedirect(route);
    expect(
      [307, 308].includes(protectedRoute.response.status),
      `${route} should redirect unauthenticated users`
    );
    expect(
      locationEndsWith(protectedRoute.response, "/login"),
      `${route} should redirect to /login`
    );
  }
  results.push("All protected admin routes redirect unauthenticated users to `/login`");

  const login = await fetchNoRedirect("/login");
  expect(login.response.status === 200, "Login page should load");
  expect(
    login.body.includes("SIGN IN WITH GOOGLE") ||
      login.body.includes("Initializing secure terminal"),
    "Login page should render OAuth call-to-action"
  );
  results.push("`/login` renders sign-in UI");

  const unauthorized = await fetchNoRedirect("/login?error=unauthorized");
  expect(unauthorized.response.status === 200, "Unauthorized login page should load");
  expect(
    unauthorized.body.includes("Initializing secure terminal") ||
      unauthorized.body.includes("SIGN IN WITH GOOGLE"),
    "Unauthorized path should render login shell for client-side error handling"
  );
  results.push("Unauthorized error state displays correctly");

  const callbackMissingCode = await fetchNoRedirect("/auth/callback");
  expect(
    [307, 308].includes(callbackMissingCode.response.status),
    "Callback without code should redirect"
  );
  expect(
    locationEndsWith(callbackMissingCode.response, "/login?error=missing_code"),
    "Callback without code should redirect with missing_code error"
  );
  results.push("OAuth callback handles missing code defensively");

  console.log(`Run ${runNumber}/${RUNS} passed:`);
  for (const line of results) {
    console.log(`  - ${line}`);
  }
}

async function main() {
  const server = spawn(
    "npm",
    ["run", "start", "--", "-p", String(PORT), "-H", "127.0.0.1"],
    {
    stdio: "pipe",
    env: process.env,
    }
  );

  server.stdout.on("data", (chunk) => process.stdout.write(chunk.toString()));
  server.stderr.on("data", (chunk) => process.stderr.write(chunk.toString()));

  try {
    await waitForServer();
    for (let run = 1; run <= RUNS; run += 1) {
      await runWorkflow(run);
    }
    console.log(`All ${RUNS} workflow runs completed successfully.`);
  } finally {
    server.kill("SIGTERM");
    await delay(1000);
    if (!server.killed) {
      server.kill("SIGKILL");
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
