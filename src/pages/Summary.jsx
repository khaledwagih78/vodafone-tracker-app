import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { balanceStatusColor, ensureMonthlyReset, getLines } from "../services/lines";
import StatusBadge from "../components/StatusBadge";

export default function Summary() {
  const { user } = useAuth();
  const [lines, setLines] = useState(null);

  useEffect(() => {
    ensureMonthlyReset(user.id).then(() => getLines(user.id).then(setLines));
  }, [user.id]);

  if (!lines) return <p>...جاري التحميل</p>;
  if (lines.length === 0) return <p className="empty-state">📭 لا توجد خطوط</p>;

  const total = lines.reduce((sum, l) => sum + Number(l.balance), 0);
  const totalRemaining = lines.reduce((sum, l) => sum + Number(l.remaining), 0);

  return (
    <div className="page">
      <h1>📊 ملخص كل الخطوط</h1>
      <table className="summary-table">
        <thead>
          <tr>
            <th></th>
            <th>رقم الخط</th>
            <th>الاسم</th>
            <th>الرصيد</th>
            <th>المتبقي</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.id}>
              <td>
                <StatusBadge color={balanceStatusColor(l.balance)} />
              </td>
              <td>
                {l.code ? `[${l.code}] ` : ""}
                {l.number}
              </td>
              <td>{l.display_name || "-"}</td>
              <td>{Number(l.balance).toLocaleString()} ج</td>
              <td>{Number(l.remaining).toLocaleString()} ج</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="totals-card">
        <span>💰 إجمالي الرصيد: {total.toLocaleString()} جنيه</span>
        <span>📊 إجمالي المتبقي: {totalRemaining.toLocaleString()} جنيه</span>
      </div>
    </div>
  );
}
