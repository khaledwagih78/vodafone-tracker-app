import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { adjustBalance, balanceStatusColor, getLine } from "../services/lines";
import { useAuth } from "../auth/AuthContext";
import StatusBadge from "../components/StatusBadge";

function LimitBar({ remaining, limit, label }) {
  const used = limit - remaining;
  const pct = limit > 0 ? Math.round((used / limit) * 100) : 0;
  const color = pct >= 90 ? "var(--red)" : pct >= 50 ? "var(--amber)" : "var(--green)";
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 700 }}>{remaining.toLocaleString()} ج متبقي ({100 - pct}%)</span>
      </div>
      <div className="limit-bar-bg">
        <div className="limit-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function LineDetail() {
  const { lineId } = useParams();
  const { user } = useAuth();
  const [line, setLine] = useState(null);
  const [showAdjust, setShowAdjust] = useState(false);
  const [newBalance, setNewBalance] = useState("");
  const [reason, setReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  async function load() {
    const data = await getLine(lineId);
    setLine(data);
    setNewBalance(String(data.balance));
  }

  useEffect(() => { load(); }, [lineId]);

  async function handleAdjust(e) {
    e.preventDefault();
    setAdjusting(true);
    try {
      await adjustBalance(user.id, lineId, Number(newBalance), reason || "-");
      setShowAdjust(false);
      setReason("");
      await load();
    } finally {
      setAdjusting(false);
    }
  }

  if (!line) return <p>...جاري التحميل</p>;

  const color = balanceStatusColor(line.balance);

  return (
    <div className="page">
      <div className="page-header">
        <h1>
          <StatusBadge color={color} /> {line.display_name || line.number}
        </h1>
        <Link to={`/edit-line/${line.id}`} className="btn">✏️ تعديل</Link>
      </div>

      <p style={{ color: "var(--ink-soft)", marginBottom: 4 }}>📱 {line.number}</p>
      {(line.commission_rate > 0) && (
        <p style={{ color: "var(--green)", fontSize: 13, marginBottom: 8 }}>
          💰 نسبة العمولة: {line.commission_rate}%
        </p>
      )}

      <div className="stats-row">
        <div className="stat-box">
          <span>الرصيد الحالي</span>
          <strong style={{ color: color === "red" ? "var(--red)" : "inherit" }}>
            {Number(line.balance).toLocaleString()} ج
          </strong>
        </div>
        <div className="stat-box">
          <span>متبقي حد السحب</span>
          <strong>{Number(line.remaining_withdraw).toLocaleString()} ج</strong>
        </div>
        <div className="stat-box">
          <span>متبقي حد الإيداع</span>
          <strong>{Number(line.remaining_deposit).toLocaleString()} ج</strong>
        </div>
      </div>

      <div className="card-inner" style={{ marginBottom: 14 }}>
        <LimitBar
          remaining={Number(line.remaining_withdraw)}
          limit={Number(line.monthly_limit)}
          label="حد السحب الشهري"
        />
        <LimitBar
          remaining={Number(line.remaining_deposit)}
          limit={Number(line.monthly_limit)}
          label="حد الإيداع الشهري"
        />
      </div>

      <div className="actions-row">
        <Link to={`/line/${line.id}/withdraw`} className="btn btn-danger">💸 سحب</Link>
        <Link to={`/line/${line.id}/deposit`} className="btn btn-success">💚 إيداع</Link>
        <Link to={`/line/${line.id}/history`} className="btn">📜 السجل</Link>
        <button onClick={() => setShowAdjust((v) => !v)} style={{ background: "var(--amber)" }}>
          🔧 ضبط الرصيد
        </button>
      </div>

      {showAdjust && (
        <form className="form-card" onSubmit={handleAdjust} style={{ marginTop: 14 }}>
          <p style={{ fontWeight: 700, margin: 0 }}>🔧 ضبط الرصيد يدوياً</p>
          <label>
            الرصيد الصحيح
            <input
              type="number"
              step="any"
              value={newBalance}
              onChange={(e) => setNewBalance(e.target.value)}
              required
            />
          </label>
          <label>
            سبب التعديل
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="مثال: تصحيح خطأ" />
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={adjusting}>{adjusting ? "..." : "حفظ"}</button>
            <button type="button" onClick={() => setShowAdjust(false)} style={{ background: "var(--ink-soft)" }}>
              إلغاء
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
