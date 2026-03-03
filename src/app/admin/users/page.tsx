import { createAdminClient } from "@/lib/supabase/admin";
import { toggleUserSuperAdmin, toggleUserStudyStatus } from "../actions";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function UsersPage({
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
    .from("profiles")
    .select(
      "id, first_name, last_name, email, is_superadmin, is_in_study, is_matrix_admin, created_datetime_utc",
      { count: "exact" }
    );

  if (query) {
    q = q.or(
      `first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`
    );
  }

  const { data: profiles, count } = await q
    .order("created_datetime_utc", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[#00ff41] text-lg font-bold tracking-wider glow-text">
          USER MANAGEMENT
        </h1>
        <p className="text-[#252525] text-[10px] mt-1">
          {count ?? 0} registered operatives in system
        </p>
      </div>

      <form method="GET" className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#303030]"
          />
          <input
            name="q"
            defaultValue={query}
            placeholder="Search by name or email..."
            className="input-terminal pl-9 py-2"
          />
        </div>
        <button type="submit" className="btn-terminal">
          [SEARCH]
        </button>
        {query && (
          <Link href="/admin/users" className="btn-terminal !text-[#505050]">
            [CLEAR]
          </Link>
        )}
      </form>

      <div className="terminal-card overflow-x-auto">
        <table className="table-admin">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Superadmin</th>
              <th>In Study</th>
              <th>Matrix Admin</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles?.map((profile) => (
              <tr key={profile.id}>
                <td className="text-[#b0b0b0] whitespace-nowrap">
                  {profile.first_name} {profile.last_name}
                </td>
                <td className="text-[#707070]">{profile.email || "\u2014"}</td>
                <td>
                  <span
                    className={
                      profile.is_superadmin ? "badge-on" : "badge-off"
                    }
                  >
                    {profile.is_superadmin ? "YES" : "NO"}
                  </span>
                </td>
                <td>
                  <span
                    className={profile.is_in_study ? "badge-on" : "badge-off"}
                  >
                    {profile.is_in_study ? "YES" : "NO"}
                  </span>
                </td>
                <td>
                  <span
                    className={
                      profile.is_matrix_admin ? "badge-on" : "badge-off"
                    }
                  >
                    {profile.is_matrix_admin ? "YES" : "NO"}
                  </span>
                </td>
                <td className="text-[#404040] text-[10px] whitespace-nowrap">
                  {profile.created_datetime_utc
                    ? new Date(
                        profile.created_datetime_utc
                      ).toLocaleDateString()
                    : "\u2014"}
                </td>
                <td>
                  <div className="flex gap-1.5">
                    <form
                      action={toggleUserSuperAdmin.bind(
                        null,
                        profile.id,
                        profile.is_superadmin
                      )}
                    >
                      <button type="submit" className="btn-terminal text-[10px]">
                        {profile.is_superadmin ? "[-ADMIN]" : "[+ADMIN]"}
                      </button>
                    </form>
                    <form
                      action={toggleUserStudyStatus.bind(
                        null,
                        profile.id,
                        profile.is_in_study
                      )}
                    >
                      <button type="submit" className="btn-terminal text-[10px]">
                        {profile.is_in_study ? "[-STUDY]" : "[+STUDY]"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {(!profiles || profiles.length === 0) && (
              <tr>
                <td colSpan={7} className="text-center text-[#1a3a1a] py-10">
                  No operatives found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs">
          <p className="text-[#303030]">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/users?q=${query}&page=${page - 1}`}
                className="btn-terminal flex items-center gap-1"
              >
                <ChevronLeft size={12} /> Prev
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/users?q=${query}&page=${page + 1}`}
                className="btn-terminal flex items-center gap-1"
              >
                Next <ChevronRight size={12} />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
