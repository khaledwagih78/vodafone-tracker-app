import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { ensureMonthlyReset, getLines, statusColor } from "../services/lines";
import StatusBadge from "../components/StatusBadge";

export default function MonthlyLimits() {
  const { user } = useAuth();
  const [lines, setLines] = useState(null);

  useEffect(() => {
    ensureMonthlyReset(user.id).then(() => getLines(user.id).then(setLines));
  }, [user.id]);

  if (!lines) return <p>...جاري التحميل</p>;
  if (lines.length === 0) return <p className="empty-state">📭 لا توجد خطوط بعد</p>;

  const totalRemaining = lines.reduce((sum, l) => sum + Number(l.remaining), 0);

  return (
    <div className="page">
      <h1>📊 حدود الخطوط الشهرية</h1>
      <div className="limits-list">
        {lines.map((l) => {
          const spent = Number(l.monthly_limit) - Number(l.remaining);
          return (
            <div className="limit-card" key={l.id}>
              <div className="limit-card-header">
                <StatusBadge color={statusColor(l.remaining)} />
                <strong>{l.display_name || l.number}</strong>
              </div>
              <div className="limit-card-body">
                <span>💰 الحد: {Number(l.monthly_limit).toLocaleString()} ج</span>
                <span>💸 صرف: {spent.toLocaleString()} ج</span>
                <span>✅ متبقي: {Number(l.remaining).toLocaleString()} ج</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="totals-card">
        <span>📌 إجمالي المتبقي: {totalRemaining.toLocaleString()} جنيه</span>
      </div>
    </div>
  );
}
