import { createAdminClient } from "@/lib/supabase/admin";
import {
  toggleCaptionPublic,
  toggleCaptionFeatured,
  deleteCaption,
} from "../actions";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

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
      "id, content, is_public, is_featured, like_count, created_datetime_utc, profiles(first_name, last_name, email), images(url, image_description), humor_flavors(slug)",
      { count: "exact" }
    );

  if (query) {
    q = q.ilike("content", `%${query}%`);
  }

  const { data: captions, count } = await q
    .order("created_datetime_utc", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[#00ff41] text-lg font-bold tracking-wider glow-text">
          CAPTION ARCHIVES
        </h1>
        <p className="text-[#252525] text-[10px] mt-1">
          {count ?? 0} captions in database
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
            placeholder="Search caption content..."
            className="input-terminal pl-9 py-2"
          />
        </div>
        <button type="submit" className="btn-terminal">
          [SEARCH]
        </button>
        {query && (
          <Link
            href="/admin/captions"
            className="btn-terminal !text-[#505050]"
          >
            [CLEAR]
          </Link>
        )}
      </form>

      <div className="terminal-card overflow-x-auto">
        <table className="table-admin">
          <thead>
            <tr>
              <th>Content</th>
              <th>Author</th>
              <th>Flavor</th>
              <th>Public</th>
              <th>Featured</th>
              <th>Likes</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {captions?.map((caption) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const profile = caption.profiles as any;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const image = caption.images as any;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const flavor = caption.humor_flavors as any;
              return (
                <tr key={caption.id}>
                  <td className="max-w-[260px]">
                    <p className="text-[#b0b0b0] truncate text-[11px]">
                      {caption.content || "\u2014"}
                    </p>
                    {image?.image_description && (
                      <p className="text-[#303030] text-[9px] truncate mt-0.5">
                        img: {image.image_description}
                      </p>
                    )}
                  </td>
                  <td className="text-[#505050] text-[10px] whitespace-nowrap">
                    {profile
                      ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
                        profile.email
                      : "\u2014"}
                  </td>
                  <td>
                    {flavor?.slug ? (
                      <span className="text-[#00d4ff] text-[10px]">
                        {flavor.slug}
                      </span>
                    ) : (
                      <span className="text-[#2a2a2a] text-[10px]">
                        {"\u2014"}
                      </span>
                    )}
                  </td>
                  <td>
                    <span
                      className={caption.is_public ? "badge-on" : "badge-off"}
                    >
                      {caption.is_public ? "YES" : "NO"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={
                        caption.is_featured ? "badge-on" : "badge-off"
                      }
                    >
                      {caption.is_featured ? "YES" : "NO"}
                    </span>
                  </td>
                  <td className="text-[#ffb000] text-[11px] tabular-nums">
                    {caption.like_count}
                  </td>
                  <td className="text-[#404040] text-[10px] whitespace-nowrap">
                    {new Date(
                      caption.created_datetime_utc
                    ).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="flex gap-1.5">
                      <form
                        action={toggleCaptionPublic.bind(
                          null,
                          caption.id,
                          caption.is_public
                        )}
                      >
                        <button
                          type="submit"
                          className="btn-terminal text-[10px]"
                        >
                          {caption.is_public ? "[-PUB]" : "[+PUB]"}
                        </button>
                      </form>
                      <form
                        action={toggleCaptionFeatured.bind(
                          null,
                          caption.id,
                          caption.is_featured
                        )}
                      >
                        <button
                          type="submit"
                          className="btn-terminal text-[10px]"
                        >
                          {caption.is_featured ? "[-FEAT]" : "[+FEAT]"}
                        </button>
                      </form>
                      <form action={deleteCaption.bind(null, caption.id)}>
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
            {(!captions || captions.length === 0) && (
              <tr>
                <td colSpan={8} className="text-center text-[#1a3a1a] py-10">
                  No captions found
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
                href={`/admin/captions?q=${query}&page=${page - 1}`}
                className="btn-terminal flex items-center gap-1"
              >
                <ChevronLeft size={12} /> Prev
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/captions?q=${query}&page=${page + 1}`}
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
