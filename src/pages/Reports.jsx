import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { useAuth } from "../auth/AuthContext";
import { getAllHistory } from "../services/transactions";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgo(n) {
  return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
}

const PRESETS = [
  { label: "اليوم", from: () => todayStr(), to: () => todayStr() },
  { label: "آخر 7 أيام", from: () => daysAgo(6), to: () => todayStr() },
  { label: "هذا الشهر", from: () => todayStr().slice(0, 7) + "-01", to: () => todayStr() },
  { label: "مخصص", from: () => "", to: () => "" },
];

export default function Reports() {
  const { user } = useAuth();
  const [preset, setPreset] = useState(0);
  const [from, setFrom] = useState(PRESETS[0].from());
  const [to, setTo] = useState(PRESETS[0].to());
  const [rows, setRows] = useState(null);

  async function load(f, t) {
    setRows(null);
    const data = await getAllHistory(user.id, {
      from: f ? f + "T00:00:00" : undefined,
      to: t ? t + "T23:59:59" : undefined,
    });
    setRows(data);
  }

  function applyPreset(idx) {
    setPreset(idx);
    if (idx < 3) {
      const f = PRESETS[idx].from();
      const t = PRESETS[idx].to();
      setFrom(f);
      setTo(t);
      load(f, t);
    }
  }

  useEffect(() => {
    load(from, to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Group by date
  const byDay = {};
  (rows || []).forEach((t) => {
    const day = t.created_at.slice(0, 10);
    if (!byDay[day]) byDay[day] = { withdraw: 0, deposit: 0, commission: 0, count: 0 };
    if (t.type === "سحب") byDay[day].withdraw += Number(t.amount);
    if (t.type === "إيداع") byDay[day].deposit += Number(t.amount);
    byDay[day].commission += Number(t.commission || 0);
    byDay[day].count++;
  });
  const days = Object.entries(byDay).sort(([a], [b]) => b.localeCompare(a));

  const grandWithdraw = days.reduce((s, [, d]) => s + d.withdraw, 0);
  const grandDeposit = days.reduce((s, [, d]) => s + d.deposit, 0);
  const grandCommission = days.reduce((s, [, d]) => s + d.commission, 0);
  const grandCount = days.reduce((s, [, d]) => s + d.count, 0);

  function exportExcel() {
    const data = days.map(([day, d]) => ({
      التاريخ: day,
      "عمليات السحب": d.withdraw,
      "عمليات الإيداع": d.deposit,
      "العمولة (ج)": d.commission,
      "عدد العمليات": d.count,
    }));
    data.push({ التاريخ: "الإجمالي", "عمليات السحب": grandWithdraw, "عمليات الإيداع": grandDeposit, "العمولة (ج)": grandCommission, "عدد العمليات": grandCount });
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [{ wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "التقرير");
    XLSX.writeFile(wb, `تقرير-اتقان-كاش-${from}-${to}.xlsx`);
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>📈 التقارير</h1>
        <button onClick={exportExcel} disabled={!rows || rows.length === 0}>⬇️ Excel</button>
      </div>

      <div className="preset-row">
        {PRESETS.map((p, i) => (
          <button
            key={p.label}
            className={preset === i ? "preset-btn active" : "preset-btn"}
            onClick={() => applyPreset(i)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {preset === 3 && (
        <div className="filter-row">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <button onClick={() => load(from, to)}>🔍 عرض</button>
        </div>
      )}

      {rows !== null && (
        <div className="totals-card" style={{ flexDirection: "row", gap: 24, flexWrap: "wrap" }}>
          <span>💸 سحب: <strong>{grandWithdraw.toLocaleString()}</strong> ج</span>
          <span>💚 إيداع: <strong>{grandDeposit.toLocaleString()}</strong> ج</span>
          <span>💰 عمولة: <strong>{grandCommission.toLocaleString()}</strong> ج</span>
          <span style={{ color: "var(--ink-soft)", fontSize: 13 }}>{grandCount} عملية</span>
        </div>
      )}

      {rows === null && <p>...جاري التحميل</p>}
      {rows !== null && days.length === 0 && <p className="empty-state">📭 لا توجد عمليات في هذه الفترة</p>}
      {days.length > 0 && (
        <div className="table-wrap">
          <table className="summary-table">
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>سحب (ج)</th>
                <th>إيداع (ج)</th>
                <th>عمولة (ج)</th>
                <th>عدد العمليات</th>
              </tr>
            </thead>
            <tbody>
              {days.map(([day, d]) => (
                <tr key={day}>
                  <td style={{ fontWeight: 600 }}>{day}</td>
                  <td style={{ color: "var(--red)" }}>{d.withdraw > 0 ? d.withdraw.toLocaleString() : "—"}</td>
                  <td style={{ color: "var(--green)" }}>{d.deposit > 0 ? d.deposit.toLocaleString() : "—"}</td>
                  <td style={{ color: "var(--primary)", fontWeight: 700 }}>
                    {d.commission > 0 ? d.commission.toLocaleString() : "—"}
                  </td>
                  <td>{d.count}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 800 }}>
                <td>الإجمالي</td>
                <td style={{ color: "var(--red)" }}>{grandWithdraw.toLocaleString()}</td>
                <td style={{ color: "var(--green)" }}>{grandDeposit.toLocaleString()}</td>
                <td style={{ color: "var(--primary)" }}>{grandCommission.toLocaleString()}</td>
                <td>{grandCount}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
