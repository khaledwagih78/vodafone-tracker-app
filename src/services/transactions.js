import { supabase } from "../supabaseClient";

export async function logTransaction(userId, lineId, type, amount, note = "-", commission = 0) {
  const { error } = await supabase.from("transactions").insert({
    user_id: userId,
    line_id: lineId,
    type,
    amount,
    note,
    commission,
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

export async function getAllHistory(userId, { lineId, type, from, to } = {}) {
  let query = supabase
    .from("transactions")
    .select("*, lines(number, display_name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (lineId) query = query.eq("line_id", lineId);
  if (type) query = query.eq("type", type);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const { data, error } = await query.limit(500);
  if (error) throw error;
  return data;
}
