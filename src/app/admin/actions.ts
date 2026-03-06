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

// ── Users ──────────────────────────────────────────────

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

// ── Images ─────────────────────────────────────────────

export async function createImage(formData: FormData) {
  const admin = await requireSuperAdmin();
  const file = formData.get("file") as File;

  if (!file || file.size === 0) {
    redirect("/admin/images");
  }

  const ext = file.name.split(".").pop() || "png";
  const fileName = `admin/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from("images")
    .upload(fileName, file, { contentType: file.type });

  if (uploadError) {
    redirect(
      `/admin/images?error=${encodeURIComponent(uploadError.message)}`
    );
  }

  const { data: urlData } = admin.storage
    .from("images")
    .getPublicUrl(fileName);

  await admin.from("images").insert({
    url: urlData.publicUrl,
    additional_context:
      (formData.get("additional_context") as string) || null,
    is_public: formData.get("is_public") === "on",
    is_common_use: formData.get("is_common_use") === "on",
  });

  revalidatePath("/admin/images");
  redirect("/admin/images");
}

export async function updateImage(imageId: string, formData: FormData) {
  const admin = await requireSuperAdmin();
  await admin
    .from("images")
    .update({
      additional_context:
        (formData.get("additional_context") as string) || null,
      image_description:
        (formData.get("image_description") as string) || null,
      is_public: formData.get("is_public") === "on",
      is_common_use: formData.get("is_common_use") === "on",
      modified_datetime_utc: new Date().toISOString(),
    })
    .eq("id", imageId);
  revalidatePath("/admin/images");
  redirect("/admin/images");
}

export async function deleteImage(imageId: string) {
  const admin = await requireSuperAdmin();
  await admin.from("images").delete().eq("id", imageId);
  revalidatePath("/admin/images");
}

// ── Caption Examples ───────────────────────────────────

export async function createCaptionExample(formData: FormData) {
  const admin = await requireSuperAdmin();
  const imageId = formData.get("image_id") as string;
  await admin.from("caption_examples").insert({
    image_description: formData.get("image_description") as string,
    caption: formData.get("caption") as string,
    explanation: formData.get("explanation") as string,
    priority: parseInt(formData.get("priority") as string) || 0,
    image_id: imageId || null,
  });
  revalidatePath("/admin/caption-examples");
  redirect("/admin/caption-examples");
}

export async function updateCaptionExample(
  id: number,
  formData: FormData
) {
  const admin = await requireSuperAdmin();
  const imageId = formData.get("image_id") as string;
  await admin
    .from("caption_examples")
    .update({
      image_description: formData.get("image_description") as string,
      caption: formData.get("caption") as string,
      explanation: formData.get("explanation") as string,
      priority: parseInt(formData.get("priority") as string) || 0,
      image_id: imageId || null,
      modified_datetime_utc: new Date().toISOString(),
    })
    .eq("id", id);
  revalidatePath("/admin/caption-examples");
  redirect("/admin/caption-examples");
}

export async function deleteCaptionExample(id: number) {
  const admin = await requireSuperAdmin();
  await admin.from("caption_examples").delete().eq("id", id);
  revalidatePath("/admin/caption-examples");
}

// ── Humor Mix ──────────────────────────────────────────

export async function updateHumorMix(id: number, formData: FormData) {
  const admin = await requireSuperAdmin();
  await admin
    .from("humor_flavor_mix")
    .update({
      caption_count: parseInt(formData.get("caption_count") as string) || 0,
    })
    .eq("id", id);
  revalidatePath("/admin/humor-mix");
  redirect("/admin/humor-mix");
}

// ── Terms ──────────────────────────────────────────────

export async function createTerm(formData: FormData) {
  const admin = await requireSuperAdmin();
  const typeId = formData.get("term_type_id") as string;
  await admin.from("terms").insert({
    term: formData.get("term") as string,
    definition: formData.get("definition") as string,
    example: formData.get("example") as string,
    priority: parseInt(formData.get("priority") as string) || 0,
    term_type_id: typeId ? parseInt(typeId) : null,
  });
  revalidatePath("/admin/terms");
  redirect("/admin/terms");
}

export async function updateTerm(id: number, formData: FormData) {
  const admin = await requireSuperAdmin();
  const typeId = formData.get("term_type_id") as string;
  await admin
    .from("terms")
    .update({
      term: formData.get("term") as string,
      definition: formData.get("definition") as string,
      example: formData.get("example") as string,
      priority: parseInt(formData.get("priority") as string) || 0,
      term_type_id: typeId ? parseInt(typeId) : null,
      modified_datetime_utc: new Date().toISOString(),
    })
    .eq("id", id);
  revalidatePath("/admin/terms");
  redirect("/admin/terms");
}

export async function deleteTerm(id: number) {
  const admin = await requireSuperAdmin();
  await admin.from("terms").delete().eq("id", id);
  revalidatePath("/admin/terms");
}

// ── LLM Models ─────────────────────────────────────────

export async function createLlmModel(formData: FormData) {
  const admin = await requireSuperAdmin();
  await admin.from("llm_models").insert({
    name: formData.get("name") as string,
    llm_provider_id: parseInt(formData.get("llm_provider_id") as string),
    provider_model_id: formData.get("provider_model_id") as string,
    is_temperature_supported: formData.get("is_temperature_supported") === "on",
  });
  revalidatePath("/admin/llm-models");
  redirect("/admin/llm-models");
}

export async function updateLlmModel(id: number, formData: FormData) {
  const admin = await requireSuperAdmin();
  await admin
    .from("llm_models")
    .update({
      name: formData.get("name") as string,
      llm_provider_id: parseInt(formData.get("llm_provider_id") as string),
      provider_model_id: formData.get("provider_model_id") as string,
      is_temperature_supported:
        formData.get("is_temperature_supported") === "on",
    })
    .eq("id", id);
  revalidatePath("/admin/llm-models");
  redirect("/admin/llm-models");
}

export async function deleteLlmModel(id: number) {
  const admin = await requireSuperAdmin();
  await admin.from("llm_models").delete().eq("id", id);
  revalidatePath("/admin/llm-models");
}

// ── LLM Providers ──────────────────────────────────────

export async function createLlmProvider(formData: FormData) {
  const admin = await requireSuperAdmin();
  await admin.from("llm_providers").insert({
    name: formData.get("name") as string,
  });
  revalidatePath("/admin/llm-providers");
  redirect("/admin/llm-providers");
}

export async function updateLlmProvider(id: number, formData: FormData) {
  const admin = await requireSuperAdmin();
  await admin
    .from("llm_providers")
    .update({ name: formData.get("name") as string })
    .eq("id", id);
  revalidatePath("/admin/llm-providers");
  redirect("/admin/llm-providers");
}

export async function deleteLlmProvider(id: number) {
  const admin = await requireSuperAdmin();
  await admin.from("llm_providers").delete().eq("id", id);
  revalidatePath("/admin/llm-providers");
}

// ── Allowed Signup Domains ─────────────────────────────

export async function createAllowedDomain(formData: FormData) {
  const admin = await requireSuperAdmin();
  await admin.from("allowed_signup_domains").insert({
    apex_domain: formData.get("apex_domain") as string,
  });
  revalidatePath("/admin/allowed-domains");
  redirect("/admin/allowed-domains");
}

export async function updateAllowedDomain(
  id: number,
  formData: FormData
) {
  const admin = await requireSuperAdmin();
  await admin
    .from("allowed_signup_domains")
    .update({ apex_domain: formData.get("apex_domain") as string })
    .eq("id", id);
  revalidatePath("/admin/allowed-domains");
  redirect("/admin/allowed-domains");
}

export async function deleteAllowedDomain(id: number) {
  const admin = await requireSuperAdmin();
  await admin.from("allowed_signup_domains").delete().eq("id", id);
  revalidatePath("/admin/allowed-domains");
}

// ── Whitelisted Emails ─────────────────────────────────

export async function createWhitelistedEmail(formData: FormData) {
  const admin = await requireSuperAdmin();
  await admin.from("whitelist_email_addresses").insert({
    email_address: formData.get("email_address") as string,
  });
  revalidatePath("/admin/whitelisted-emails");
  redirect("/admin/whitelisted-emails");
}

export async function updateWhitelistedEmail(
  id: number,
  formData: FormData
) {
  const admin = await requireSuperAdmin();
  await admin
    .from("whitelist_email_addresses")
    .update({ email_address: formData.get("email_address") as string })
    .eq("id", id);
  revalidatePath("/admin/whitelisted-emails");
  redirect("/admin/whitelisted-emails");
}

export async function deleteWhitelistedEmail(id: number) {
  const admin = await requireSuperAdmin();
  await admin.from("whitelist_email_addresses").delete().eq("id", id);
  revalidatePath("/admin/whitelisted-emails");
}
