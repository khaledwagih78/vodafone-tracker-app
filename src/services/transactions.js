import { supabase } from "../supabaseClient";

export async function logTransaction(userId, lineId, type, amount, note = "-") {
  const { error } = await supabase.from("transactions").insert({
    user_id: userId,
    line_id: lineId,
    type,
    amount,
    note,
  });
  if (error) throw error;
}

export async function getHistory(lineId) {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("line_id", lineId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getAllHistory(userId) {
  const { data, error } = await supabase
    .from("transactions")
    .select("*, lines(number, display_name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data;
}
