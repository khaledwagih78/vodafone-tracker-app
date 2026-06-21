import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import { balanceStatusColor } from "../services/lines";

export default function LineCard({ line }) {
  const name = line.display_name || line.number;
  const color = balanceStatusColor(line.balance);

  return (
    <Link to={`/line/${line.id}`} className="line-card">
      <div className="line-card-header">
        <StatusBadge color={color} />
        <span className="line-name">
          {line.code ? `[${line.code}] ` : ""}
          {name}
        </span>
      </div>
      <div className="line-card-body">
        <span>الرصيد: {Number(line.balance).toLocaleString()} ج</span>
        <span>متبقي: {Number(line.remaining).toLocaleString()} ج</span>
      </div>
    </Link>
  );
}
