"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_superadmin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_superadmin) redirect("/login?error=unauthorized");

  return admin;
}

export async function toggleUserSuperAdmin(
  profileId: string,
  currentValue: boolean
) {
  const admin = await requireSuperAdmin();
  await admin
    .from("profiles")
    .update({
      is_superadmin: !currentValue,
      modified_datetime_utc: new Date().toISOString(),
    })
    .eq("id", profileId);
  revalidatePath("/admin/users");
}

export async function toggleUserStudyStatus(
  profileId: string,
  currentValue: boolean
) {
  const admin = await requireSuperAdmin();
  await admin
    .from("profiles")
    .update({
      is_in_study: !currentValue,
      modified_datetime_utc: new Date().toISOString(),
    })
    .eq("id", profileId);
  revalidatePath("/admin/users");
}

export async function toggleImagePublic(
  imageId: string,
  currentValue: boolean
) {
  const admin = await requireSuperAdmin();
  await admin
    .from("images")
    .update({
      is_public: !currentValue,
      modified_datetime_utc: new Date().toISOString(),
    })
    .eq("id", imageId);
  revalidatePath("/admin/images");
}

export async function toggleImageCommonUse(
  imageId: string,
  currentValue: boolean
) {
  const admin = await requireSuperAdmin();
  await admin
    .from("images")
    .update({
      is_common_use: !currentValue,
      modified_datetime_utc: new Date().toISOString(),
    })
    .eq("id", imageId);
  revalidatePath("/admin/images");
}

export async function deleteImage(imageId: string) {
  const admin = await requireSuperAdmin();
  await admin.from("images").delete().eq("id", imageId);
  revalidatePath("/admin/images");
}

export async function toggleCaptionPublic(
  captionId: string,
  currentValue: boolean
) {
  const admin = await requireSuperAdmin();
  await admin
    .from("captions")
    .update({
      is_public: !currentValue,
      modified_datetime_utc: new Date().toISOString(),
    })
    .eq("id", captionId);
  revalidatePath("/admin/captions");
}

export async function toggleCaptionFeatured(
  captionId: string,
  currentValue: boolean
) {
  const admin = await requireSuperAdmin();
  await admin
    .from("captions")
    .update({
      is_featured: !currentValue,
      modified_datetime_utc: new Date().toISOString(),
    })
    .eq("id", captionId);
  revalidatePath("/admin/captions");
}

export async function deleteCaption(captionId: string) {
  const admin = await requireSuperAdmin();
  await admin.from("captions").delete().eq("id", captionId);
  revalidatePath("/admin/captions");
}
