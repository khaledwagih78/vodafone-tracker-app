import { supabase } from "../supabaseClient";

// حساب خالد بس - ده اللي يقدر يشوف صفحة لوحة التحكم ويفعّل المستخدمين
export const ADMIN_USER_ID = "0e0567cb-0148-4989-8510-77ee1ac88199";

// يضمن وجود صف "profile" لكل مستخدم (يبدأ تجربة 14 يوم تلقائيًا أول ما يسجّل دخول)
export async function ensureProfile(userId, email) {
  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (selectError) throw selectError;
  if (existing) return;

  const { error: insertError } = await supabase.from("profiles").insert({ id: userId, email });
  // كود 23505 = الصف اتعمل فعلاً من طلب متزامن تاني - نتجاهله، مش خطأ حقيقي
  if (insertError && insertError.code !== "23505") throw insertError;
}

export async function getProfile(userId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

// هل ليه صلاحية يستخدم التطبيق؟ مفعّل يدويًا، أو لسه جوه فترة التجربة
export function isAccessAllowed(profile) {
  if (!profile) return false;
  if (profile.is_active) return true;
  return new Date(profile.trial_ends_at) > new Date();
}

export function trialDaysLeft(profile) {
  if (!profile) return 0;
  const diffMs = new Date(profile.trial_ends_at) - new Date();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

// ==================== لوحة تحكم المالك ====================
export async function getAllProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function setActive(userId, isActive) {
  const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", userId);
  if (error) throw error;
}
