import { supabase } from "../supabaseClient";
import { logTransaction } from "./transactions";

const DEFAULT_MONTHLY_LIMIT = 200000;
export const MONTHLY_LIMIT_OPTIONS = [60000, 200000];
const LOW_REMAINING_THRESHOLD = 20000;
const LOW_BALANCE_THRESHOLD = 1000;

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function ensureMonthlyReset(userId) {
  const month = currentMonth();
  const { data: stale, error } = await supabase
    .from("lines")
    .select("id, monthly_limit")
    .eq("user_id", userId)
    .neq("last_reset_month", month);
  if (error) throw error;
  if (!stale || stale.length === 0) return;

  await Promise.all(
    stale.map((line) =>
      supabase
        .from("lines")
        .update({
          remaining_withdraw: line.monthly_limit,
          remaining_deposit: line.monthly_limit,
          last_reset_month: month,
        })
        .eq("id", line.id)
    )
  );
}

export async function getLines(userId) {
  const { data, error } = await supabase
    .from("lines")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getLine(lineId) {
  const { data, error } = await supabase.from("lines").select("*").eq("id", lineId).single();
  if (error) throw error;
  return data;
}

export async function addLine(
  userId,
  number,
  displayName = "",
  monthlyLimit = DEFAULT_MONTHLY_LIMIT,
  commissionRate = 0
) {
  const { data: existing } = await supabase
    .from("lines")
    .select("id")
    .eq("user_id", userId)
    .eq("number", number)
    .maybeSingle();
  if (existing) throw new Error(`الخط ${number} موجود بالفعل`);

  const { data, error } = await supabase
    .from("lines")
    .insert({
      user_id: userId,
      number,
      display_name: displayName || null,
      balance: 0,
      monthly_limit: monthlyLimit,
      remaining_withdraw: monthlyLimit,
      remaining_deposit: monthlyLimit,
      last_reset_month: currentMonth(),
      commission_rate: commissionRate,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function editLine(lineId, { code, displayName, monthlyLimit, commissionRate }) {
  const updates = { code, display_name: displayName };
  if (monthlyLimit !== undefined) updates.monthly_limit = monthlyLimit;
  if (commissionRate !== undefined) updates.commission_rate = commissionRate;

  const { data, error } = await supabase
    .from("lines")
    .update(updates)
    .eq("id", lineId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteLine(lineId) {
  const { error } = await supabase.from("lines").delete().eq("id", lineId);
  if (error) throw error;
}

export async function adjustBalance(userId, lineId, newBalance, reason = "-") {
  const { data, error } = await supabase
    .from("lines")
    .update({ balance: newBalance })
    .eq("id", lineId)
    .select()
    .single();
  if (error) throw error;
  await logTransaction(userId, lineId, "ضبط رصيد", newBalance, reason || "-", 0);
  return data;
}

export async function withdraw(userId, lineId, amount, note = "-") {
  const line = await getLine(lineId);
  const newRemainingWithdraw = line.remaining_withdraw - amount;

  if (newRemainingWithdraw < 0) {
    return {
      rejected: true,
      message: `🚫 تم رفض السحب - هيخلي الخط يتعدى حد السحب الشهري بـ ${Math.abs(newRemainingWithdraw).toLocaleString()} جنيه`,
    };
  }

  const commission = amount * ((line.commission_rate || 0) / 100);
  const newBalance = line.balance - amount;
  const { data, error } = await supabase
    .from("lines")
    .update({ balance: newBalance, remaining_withdraw: newRemainingWithdraw })
    .eq("id", lineId)
    .select()
    .single();
  if (error) throw error;

  await logTransaction(userId, lineId, "سحب", amount, note, commission);

  return {
    rejected: false,
    line: data,
    commission,
    warning: limitWarningMessage(newRemainingWithdraw, line.monthly_limit, "السحب"),
  };
}

export async function deposit(userId, lineId, amount, note = "-") {
  const line = await getLine(lineId);
  const newRemainingDeposit = line.remaining_deposit - amount;

  if (newRemainingDeposit < 0) {
    return {
      rejected: true,
      message: `🚫 تم رفض الإيداع - هيخلي الخط يتعدى حد الإيداع الشهري بـ ${Math.abs(newRemainingDeposit).toLocaleString()} جنيه`,
    };
  }

  const commission = amount * ((line.commission_rate || 0) / 100);
  const newBalance = line.balance + amount;
  const { data, error } = await supabase
    .from("lines")
    .update({ balance: newBalance, remaining_deposit: newRemainingDeposit })
    .eq("id", lineId)
    .select()
    .single();
  if (error) throw error;

  await logTransaction(userId, lineId, "إيداع", amount, note, commission);

  return {
    rejected: false,
    line: data,
    commission,
    warning: limitWarningMessage(newRemainingDeposit, line.monthly_limit, "الإيداع"),
  };
}

export async function transfer(userId, fromLineId, toLineId, amount, note = "") {
  if (fromLineId === toLineId) throw new Error("الخط المرسِل والمستقبِل هو نفسه");

  const [from, to] = await Promise.all([getLine(fromLineId), getLine(toLineId)]);

  if (from.remaining_withdraw - amount < 0) {
    return {
      rejected: true,
      message: `🚫 الخط المرسِل تجاوز حد السحب الشهري بـ ${Math.abs(from.remaining_withdraw - amount).toLocaleString()} جنيه`,
    };
  }
  if (to.remaining_deposit - amount < 0) {
    return {
      rejected: true,
      message: `🚫 الخط المستقبِل تجاوز حد الإيداع الشهري بـ ${Math.abs(to.remaining_deposit - amount).toLocaleString()} جنيه`,
    };
  }

  const { error: e1 } = await supabase
    .from("lines")
    .update({ balance: from.balance - amount, remaining_withdraw: from.remaining_withdraw - amount })
    .eq("id", fromLineId);
  if (e1) throw e1;

  const { error: e2 } = await supabase
    .from("lines")
    .update({ balance: to.balance + amount, remaining_deposit: to.remaining_deposit - amount })
    .eq("id", toLineId);
  if (e2) throw e2;

  const toName = to.display_name || to.number;
  const fromName = from.display_name || from.number;
  const suffix = note ? ` — ${note}` : "";

  await logTransaction(userId, fromLineId, "سحب", amount, `📤 نقل إلى ${toName}${suffix}`, 0);
  await logTransaction(userId, toLineId, "إيداع", amount, `📥 نقل من ${fromName}${suffix}`, 0);

  return { rejected: false };
}

export function limitWarningMessage(remaining, monthlyLimit, label) {
  if (remaining <= 0) {
    return `🔴 تحذير! تجاوزت حد ${label} الشهري بـ ${Math.abs(remaining).toLocaleString()} جنيه`;
  }
  const threshold = monthlyLimit * 0.5;
  if (remaining <= threshold) {
    return `⚠️ تنبيه! اقتربت من حد ${label} الشهري! متبقي فقط ${remaining.toLocaleString()} جنيه`;
  }
  return null;
}

export function statusColor(remaining) {
  if (remaining <= 0) return "red";
  if (remaining < LOW_REMAINING_THRESHOLD) return "warning";
  return "green";
}

export function balanceStatusColor(balance) {
  if (balance < 0) return "red";
  if (balance < LOW_BALANCE_THRESHOLD) return "warning";
  return "green";
}
