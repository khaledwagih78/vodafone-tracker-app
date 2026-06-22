import { supabase } from "../supabaseClient";
import { logTransaction } from "./transactions";

const DEFAULT_MONTHLY_LIMIT = 200000;
export const MONTHLY_LIMIT_OPTIONS = [60000, 200000];
// عتبة ثابتة لكل التجار (مطابقة لسلوك البوت في /متبقي) - مش نسبة من الحد
const LOW_REMAINING_THRESHOLD = 20000;
const LOW_BALANCE_THRESHOLD = 1000;

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// يرجّع "متبقي السحب" و"متبقي الإيداع" لقيمة الحد الشهري لأي خط لسه فاضل على شهر قديم
// بدل Cron مدفوع - بيتنفذ عند كل تحميل للداشبورد (lazy reset)
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

export async function addLine(userId, number, displayName = "", monthlyLimit = DEFAULT_MONTHLY_LIMIT) {
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
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function editLine(lineId, { code, displayName, monthlyLimit }) {
  const updates = { code, display_name: displayName };
  if (monthlyLimit !== undefined) updates.monthly_limit = monthlyLimit;

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

export async function setBalance(userId, lineId, amount) {
  const { data, error } = await supabase
    .from("lines")
    .update({ balance: amount })
    .eq("id", lineId)
    .select()
    .single();
  if (error) throw error;
  await logTransaction(userId, lineId, "ضبط رصيد", amount, "-");
  return data;
}

// حد السحب الشهري مستقل تمامًا عن حد الإيداع - لو السحب هيخلي الخط يتعدى
// حد السحب بتاعه -> رفض كامل، بدون أي كتابة
export async function withdraw(userId, lineId, amount, note = "-") {
  const line = await getLine(lineId);
  const newRemainingWithdraw = line.remaining_withdraw - amount;

  if (newRemainingWithdraw < 0) {
    return {
      rejected: true,
      message: `🚫 تم رفض السحب - هيخلي الخط يتعدى حد السحب الشهري بـ ${Math.abs(newRemainingWithdraw).toLocaleString()} جنيه`,
    };
  }

  const newBalance = line.balance - amount;
  const { data, error } = await supabase
    .from("lines")
    .update({ balance: newBalance, remaining_withdraw: newRemainingWithdraw })
    .eq("id", lineId)
    .select()
    .single();
  if (error) throw error;

  await logTransaction(userId, lineId, "سحب", amount, note);

  return {
    rejected: false,
    line: data,
    warning: limitWarningMessage(newRemainingWithdraw, line.monthly_limit, "السحب"),
  };
}

// حد الإيداع الشهري مستقل تمامًا عن حد السحب - لو الإيداع هيخلي الخط يتعدى
// حد الإيداع بتاعه -> رفض كامل، بدون أي كتابة
export async function deposit(userId, lineId, amount) {
  const line = await getLine(lineId);
  const newRemainingDeposit = line.remaining_deposit - amount;

  if (newRemainingDeposit < 0) {
    return {
      rejected: true,
      message: `🚫 تم رفض الإيداع - هيخلي الخط يتعدى حد الإيداع الشهري بـ ${Math.abs(newRemainingDeposit).toLocaleString()} جنيه`,
    };
  }

  const newBalance = line.balance + amount;
  const { data, error } = await supabase
    .from("lines")
    .update({ balance: newBalance, remaining_deposit: newRemainingDeposit })
    .eq("id", lineId)
    .select()
    .single();
  if (error) throw error;

  await logTransaction(userId, lineId, "إيداع", amount, "-");

  return {
    rejected: false,
    line: data,
    warning: limitWarningMessage(newRemainingDeposit, line.monthly_limit, "الإيداع"),
  };
}

// نفس منطق limitWarningMessage في البوت: تجاوز -> أحمر، أقل من 50% من الحد -> تنبيه
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

// لون عرض "متبقي" في صفحة الحدود الشهرية - عتبة ثابتة 20,000 لكل التجار
export function statusColor(remaining) {
  if (remaining <= 0) return "red";
  if (remaining < LOW_REMAINING_THRESHOLD) return "warning";
  return "green";
}

// لون عرض الرصيد الحالي في الداشبورد/الملخص
export function balanceStatusColor(balance) {
  if (balance < 0) return "red";
  if (balance < LOW_BALANCE_THRESHOLD) return "warning";
  return "green";
}
