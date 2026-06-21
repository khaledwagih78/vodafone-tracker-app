import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { balanceStatusColor, getLine } from "../services/lines";
import StatusBadge from "../components/StatusBadge";

export default function LineDetail() {
  const { lineId } = useParams();
  const [line, setLine] = useState(null);

  useEffect(() => {
    getLine(lineId).then(setLine);
  }, [lineId]);

  if (!line) return <p>...جاري التحميل</p>;

  const color = balanceStatusColor(line.balance);

  return (
    <div className="page">
      <div className="page-header">
        <h1>
          <StatusBadge color={color} /> {line.display_name || line.number}
        </h1>
        <Link to={`/edit-line/${line.id}`} className="btn">
          ✏️ تعديل
        </Link>
      </div>
      <p>📱 {line.number}</p>
      <div className="stats-row">
        <div className="stat-box">
          <span>الرصيد الحالي</span>
          <strong>{Number(line.balance).toLocaleString()} ج</strong>
        </div>
        <div className="stat-box">
          <span>المتبقي من الحد الشهري</span>
          <strong>{Number(line.remaining).toLocaleString()} ج</strong>
        </div>
      </div>
      <div className="actions-row">
        <Link to={`/line/${line.id}/withdraw`} className="btn btn-danger">
          💸 سحب
        </Link>
        <Link to={`/line/${line.id}/deposit`} className="btn btn-success">
          💚 إيداع
        </Link>
        <Link to={`/line/${line.id}/history`} className="btn">
          📜 السجل
        </Link>
      </div>
    </div>
  );
}
