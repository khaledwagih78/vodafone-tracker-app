import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ensureMonthlyReset, getLines } from "../services/lines";
import LineCard from "../components/LineCard";

export default function Dashboard() {
  const { user } = useAuth();
  const [lines, setLines] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      await ensureMonthlyReset(user.id);
      setLines(await getLines(user.id));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [user.id]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>📱 الخطوط المسجلة</h1>
        <Link to="/add-line" className="btn">
          ➕ إضافة خط
        </Link>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {lines === null && <p>...جاري التحميل</p>}
      {lines && lines.length === 0 && <p className="empty-state">📭 لا توجد خطوط بعد</p>}
      <div className="line-grid">
        {lines && lines.map((line) => <LineCard key={line.id} line={line} />)}
      </div>
    </div>
  );
}
