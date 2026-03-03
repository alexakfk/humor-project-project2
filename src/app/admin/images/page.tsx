import { createAdminClient } from "@/lib/supabase/admin";
import {
  toggleImagePublic,
  toggleImageCommonUse,
  deleteImage,
} from "../actions";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function ImagesPage({
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
    .from("images")
    .select(
      "id, url, is_public, is_common_use, image_description, additional_context, created_datetime_utc, profiles(first_name, last_name, email)",
      { count: "exact" }
    );

  if (query) {
    q = q.or(
      `image_description.ilike.%${query}%,additional_context.ilike.%${query}%`
    );
  }

  const { data: images, count } = await q
    .order("created_datetime_utc", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[#00ff41] text-lg font-bold tracking-wider glow-text">
          IMAGE REGISTRY
        </h1>
        <p className="text-[#252525] text-[10px] mt-1">
          {count ?? 0} images indexed
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
            placeholder="Search by description..."
            className="input-terminal pl-9 py-2"
          />
        </div>
        <button type="submit" className="btn-terminal">
          [SEARCH]
        </button>
        {query && (
          <Link href="/admin/images" className="btn-terminal !text-[#505050]">
            [CLEAR]
          </Link>
        )}
      </form>

      <div className="terminal-card overflow-x-auto">
        <table className="table-admin">
          <thead>
            <tr>
              <th>Preview</th>
              <th>Description</th>
              <th>Uploaded By</th>
              <th>Public</th>
              <th>Common Use</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {images?.map((image) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const profile = image.profiles as any;
              return (
                <tr key={image.id}>
                  <td>
                    {image.url ? (
                      <img
                        src={image.url}
                        alt=""
                        className="w-11 h-11 object-cover rounded border border-[#1a3a1a]"
                      />
                    ) : (
                      <div className="w-11 h-11 bg-[#0a0a0a] border border-[#1a3a1a] rounded flex items-center justify-center text-[#2a2a2a] text-[8px]">
                        N/A
                      </div>
                    )}
                  </td>
                  <td className="max-w-[220px]">
                    <p className="text-[#808080] truncate text-[11px]">
                      {image.image_description ||
                        image.additional_context ||
                        "\u2014"}
                    </p>
                  </td>
                  <td className="text-[#505050] text-[10px] whitespace-nowrap">
                    {profile
                      ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
                        profile.email
                      : "\u2014"}
                  </td>
                  <td>
                    <span
                      className={image.is_public ? "badge-on" : "badge-off"}
                    >
                      {image.is_public ? "YES" : "NO"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={
                        image.is_common_use ? "badge-on" : "badge-off"
                      }
                    >
                      {image.is_common_use ? "YES" : "NO"}
                    </span>
                  </td>
                  <td className="text-[#404040] text-[10px] whitespace-nowrap">
                    {new Date(
                      image.created_datetime_utc
                    ).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="flex gap-1.5">
                      <form
                        action={toggleImagePublic.bind(
                          null,
                          image.id,
                          image.is_public ?? false
                        )}
                      >
                        <button
                          type="submit"
                          className="btn-terminal text-[10px]"
                        >
                          {image.is_public ? "[-PUB]" : "[+PUB]"}
                        </button>
                      </form>
                      <form
                        action={toggleImageCommonUse.bind(
                          null,
                          image.id,
                          image.is_common_use ?? false
                        )}
                      >
                        <button
                          type="submit"
                          className="btn-terminal text-[10px]"
                        >
                          {image.is_common_use ? "[-COM]" : "[+COM]"}
                        </button>
                      </form>
                      <form action={deleteImage.bind(null, image.id)}>
                        <button
                          type="submit"
                          className="btn-terminal text-[10px] hover:!text-[#ff0033] hover:!border-[#ff0033]"
                        >
                          <Trash2 size={11} />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {(!images || images.length === 0) && (
              <tr>
                <td colSpan={7} className="text-center text-[#1a3a1a] py-10">
                  No images found
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
                href={`/admin/images?q=${query}&page=${page - 1}`}
                className="btn-terminal flex items-center gap-1"
              >
                <ChevronLeft size={12} /> Prev
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/images?q=${query}&page=${page + 1}`}
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
