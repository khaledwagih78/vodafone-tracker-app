import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getHistory } from "../services/transactions";

export default function History() {
  const { lineId } = useParams();
  const [history, setHistory] = useState(null);

  useEffect(() => {
    getHistory(lineId).then(setHistory);
  }, [lineId]);

  if (!history) return <p>...جاري التحميل</p>;
  if (history.length === 0) return <p className="empty-state">📭 لا يوجد سجل عمليات</p>;

  return (
    <div className="page">
      <h1>📜 سجل العمليات</h1>
      <table className="summary-table">
        <thead>
          <tr>
            <th>التاريخ</th>
            <th>النوع</th>
            <th>المبلغ</th>
            <th>ملاحظة</th>
          </tr>
        </thead>
        <tbody>
          {history.map((t) => (
            <tr key={t.id}>
              <td>{new Date(t.created_at).toLocaleString("ar-EG")}</td>
              <td>{t.type}</td>
              <td>{Number(t.amount).toLocaleString()} ج</td>
              <td>{t.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
