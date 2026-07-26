import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { deposit } from "../services/lines";

export default function Deposit() {
  const { lineId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await deposit(user.id, lineId, Number(amount));
      setResult(res);
      if (!res.rejected) {
        setTimeout(() => navigate(`/line/${lineId}`), 1500);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <h1>💚 إيداع في الخط</h1>
      <form className="form-card" onSubmit={handleSubmit}>
        <label>
          المبلغ
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "..." : "تأكيد الإيداع"}
        </button>
      </form>
      {result && result.rejected && <div className="alert alert-error">{result.message}</div>}
      {result && !result.rejected && (
        <div className="alert alert-success">
          ✅ تم تسجيل الإيداع
          {result.commission > 0 && (
            <div style={{ marginTop: 6, fontWeight: 700, color: "var(--green)" }}>
              💰 عمولة: {Number(result.commission).toLocaleString()} ج
            </div>
          )}
          {result.warning && <div className="alert alert-warning">{result.warning}</div>}
        </div>
      )}
    </div>
  );
}
