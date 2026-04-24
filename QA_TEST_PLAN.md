# End-to-End QA Test Plan

## Scope
- Application: Humor Ops admin console (`/login`, `/auth/callback`, `/admin/*`).
- Goal: verify authentication gates, role authorization, navigation, data read/write flows, and resilience paths.
- Strategy: test as a branch tree; each branch is a complete user pathway with expected outcomes.

## Branch Tree

### Branch A: Entry and Routing
- A1: Visit `/` while unauthenticated -> redirect chain ends at `/login`.
- A2: Visit `/` while authenticated superadmin -> land on `/admin`.
- A3: Visit unknown path -> Next not-found behavior.

### Branch B: Authentication
- B1: Visit `/login` unauthenticated -> login UI renders.
- B2: Click Google sign-in -> OAuth provider redirect starts.
- B3: Return via `/auth/callback?code=...` with valid code -> session established -> redirect `/admin`.
- B4: Visit `/auth/callback` without code -> redirect `/login?error=missing_code`.
- B5: OAuth exchange failure -> redirect `/login?error=auth_failed`.
- B6: Authenticated user revisits `/login` -> middleware redirect to `/admin` (unless explicit error query).

### Branch C: Authorization and Session Protection
- C1: Unauthenticated visit to each protected admin route -> redirect `/login`.
- C2: Authenticated non-superadmin visit to admin routes -> redirect `/login?error=unauthorized`.
- C3: Superadmin access to admin routes -> content renders.
- C4: Logout from sidebar -> sign-out succeeds -> redirect `/login`.

### Branch D: Dashboard and Read Views
- D1: `/admin` dashboard counters/charts render with data.
- D2: Read/list pages load without runtime errors:
  - `/admin/users`
  - `/admin/images`
  - `/admin/captions`
  - `/admin/caption-requests`
  - `/admin/caption-examples`
  - `/admin/humor-flavors`
  - `/admin/humor-flavor-steps`
  - `/admin/humor-mix`
  - `/admin/llm-models`
  - `/admin/llm-providers`
  - `/admin/llm-prompt-chains`
  - `/admin/llm-responses`
  - `/admin/terms`
  - `/admin/allowed-domains`
  - `/admin/whitelisted-emails`

### Branch E: Content Mutation (Server Actions)
- E1: Users
  - Toggle `is_superadmin`; verify persisted state and revalidation.
  - Toggle `is_in_study`; verify persisted state and revalidation.
- E2: Images
  - Create image with file upload and metadata.
  - Update image metadata/flags.
  - Delete image.
  - Negative: submit without file -> no crash, redirects safely.
- E3: Caption Examples
  - Create, update, delete example records.
  - Verify optional `image_id` behavior.
- E4: Humor Mix
  - Update `caption_count`; verify persisted and visible.
- E5: Terms
  - Create, update, delete; verify `term_type_id` optional handling.
- E6: LLM Models
  - Create, update, delete model rows with provider linkage.
- E7: LLM Providers
  - Create, update, delete provider rows.
- E8: Allowed Domains
  - Create, update, delete apex domains.
- E9: Whitelisted Emails
  - Create, update, delete email entries.

### Branch F: Error/Resilience Paths
- F1: Missing env vars (Supabase URL/keys) surfaces explicit startup/runtime errors.
- F2: Supabase transient failure during list fetch -> page shows graceful fallback/error state.
- F3: Storage upload failure -> redirect with URL-encoded error query and no partial write.
- F4: Invalid numeric fields -> safe coercion behavior (`parseInt(...) || 0`) verified.

## Execution Matrix
- Automated smoke (implemented): A1, B1, B4, C1 across all admin routes, executed 3 full runs.
- Manual authenticated pass (required for demo signoff): A2, B2, B3, B5, C2, C3, C4, all D/E/F with real superadmin and non-superadmin accounts.

## Pass Criteria
- All redirects and guardrails behave exactly as expected.
- No uncaught runtime errors in browser/server logs.
- CRUD operations persist correctly and revalidated UI reflects new state.
- OAuth and logout flows are deterministic and user-facing errors are understandable.
