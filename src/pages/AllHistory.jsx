import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { useAuth } from "../auth/AuthContext";
import { getLines } from "../services/lines";
import { getAllHistory } from "../services/transactions";

export default function AllHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState(null);
  const [lines, setLines] = useState([]);
  const [lineId, setLineId] = useState("");
  const [type, setType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  async function load() {
    setHistory(null);
    const data = await getAllHistory(user.id, {
      lineId: lineId || undefined,
      type: type || undefined,
      from: from ? from + "T00:00:00" : undefined,
      to: to ? to + "T23:59:59" : undefined,
    });
    setHistory(data);
  }

  useEffect(() => {
    getLines(user.id).then(setLines);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = history || [];
  const totalWithdraw = rows.filter((t) => t.type === "سحب").reduce((s, t) => s + Number(t.amount), 0);
  const totalDeposit = rows.filter((t) => t.type === "إيداع").reduce((s, t) => s + Number(t.amount), 0);
  const totalCommission = rows.reduce((s, t) => s + Number(t.commission || 0), 0);

  function exportExcel() {
    const data = rows.map((t) => ({
      التاريخ: new Date(t.created_at).toLocaleString("ar-EG"),
      الخط: t.lines?.display_name || t.lines?.number || "-",
      النوع: t.type,
      "المبلغ (ج)": Number(t.amount),
      "العمولة (ج)": Number(t.commission || 0),
      ملاحظة: t.note,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [{ wch: 22 }, { wch: 16 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "السجل");
    XLSX.writeFile(wb, `سجل-اتقان-كاش-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>📋 السجل الكامل</h1>
        <button onClick={exportExcel} disabled={!history || rows.length === 0}>
          ⬇️ Excel
        </button>
      </div>

      <div className="filter-row">
        <select value={lineId} onChange={(e) => setLineId(e.target.value)}>
          <option value="">كل الخطوط</option>
          {lines.map((l) => (
            <option key={l.id} value={l.id}>{l.display_name || l.number}</option>
          ))}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">كل العمليات</option>
          <option value="سحب">💸 سحب</option>
          <option value="إيداع">💚 إيداع</option>
          <option value="ضبط رصيد">🔧 ضبط رصيد</option>
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="من" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} placeholder="إلى" />
        <button onClick={load}>🔍 بحث</button>
      </div>

      <div className="totals-card" style={{ flexDirection: "row", gap: 24, flexWrap: "wrap" }}>
        <span>💸 سحب: <strong>{totalWithdraw.toLocaleString()}</strong> ج</span>
        <span>💚 إيداع: <strong>{totalDeposit.toLocaleString()}</strong> ج</span>
        <span>💰 عمولة: <strong>{totalCommission.toLocaleString()}</strong> ج</span>
        <span style={{ color: "var(--ink-soft)", fontSize: 13 }}>{rows.length} عملية</span>
      </div>

      {history === null && <p>...جاري التحميل</p>}
      {history !== null && rows.length === 0 && <p className="empty-state">📭 لا توجد عمليات</p>}
      {rows.length > 0 && (
        <div className="table-wrap">
          <table className="summary-table">
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>الخط</th>
                <th>النوع</th>
                <th>المبلغ</th>
                <th>العمولة</th>
                <th>ملاحظة</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td style={{ fontSize: 13, whiteSpace: "nowrap" }}>
                    {new Date(t.created_at).toLocaleString("ar-EG")}
                  </td>
                  <td>{t.lines?.display_name || t.lines?.number || "-"}</td>
                  <td>
                    <span className={`type-badge ${t.type === "سحب" ? "red" : t.type === "إيداع" ? "green" : "gray"}`}>
                      {t.type}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>{Number(t.amount).toLocaleString()} ج</td>
                  <td style={{ color: "var(--green)" }}>
                    {Number(t.commission || 0) > 0 ? `${Number(t.commission).toLocaleString()} ج` : "—"}
                  </td>
                  <td style={{ color: "var(--ink-soft)", fontSize: 13 }}>{t.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
