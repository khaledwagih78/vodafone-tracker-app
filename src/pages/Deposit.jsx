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
      setTimeout(() => navigate(`/line/${lineId}`), 1500);
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
      {result && (
        <div className="alert alert-success">
          ✅ تم تسجيل الإيداع
          {result.warning && <div className="alert alert-warning">{result.warning}</div>}
        </div>
      )}
    </div>
  );
}
