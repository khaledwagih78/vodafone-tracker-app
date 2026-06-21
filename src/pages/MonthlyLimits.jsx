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

  const totalRemainingWithdraw = lines.reduce((sum, l) => sum + Number(l.remaining_withdraw), 0);
  const totalRemainingDeposit = lines.reduce((sum, l) => sum + Number(l.remaining_deposit), 0);

  return (
    <div className="page">
      <h1>📊 حدود الخطوط الشهرية</h1>
      <div className="limits-list">
        {lines.map((l) => {
          const spentWithdraw = Number(l.monthly_limit) - Number(l.remaining_withdraw);
          const spentDeposit = Number(l.monthly_limit) - Number(l.remaining_deposit);
          return (
            <div className="limit-card" key={l.id}>
              <div className="limit-card-header">
                <strong>{l.display_name || l.number}</strong>
              </div>
              <div className="limit-card-body">
                <span>
                  <StatusBadge color={statusColor(l.remaining_withdraw)} /> حد السحب:{" "}
                  {Number(l.monthly_limit).toLocaleString()} ج | صرف: {spentWithdraw.toLocaleString()} ج | متبقي:{" "}
                  {Number(l.remaining_withdraw).toLocaleString()} ج
                </span>
                <span>
                  <StatusBadge color={statusColor(l.remaining_deposit)} /> حد الإيداع:{" "}
                  {Number(l.monthly_limit).toLocaleString()} ج | صرف: {spentDeposit.toLocaleString()} ج | متبقي:{" "}
                  {Number(l.remaining_deposit).toLocaleString()} ج
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="totals-card">
        <span>📌 إجمالي متبقي السحب: {totalRemainingWithdraw.toLocaleString()} جنيه</span>
        <span>📌 إجمالي متبقي الإيداع: {totalRemainingDeposit.toLocaleString()} جنيه</span>
      </div>
    </div>
  );
}
