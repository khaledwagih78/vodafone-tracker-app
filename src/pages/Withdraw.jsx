import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { withdraw } from "../services/lines";

export default function Withdraw() {
  const { lineId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await withdraw(user.id, lineId, Number(amount), note || "-");
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
      <h1>💸 سحب من الخط</h1>
      <form className="form-card" onSubmit={handleSubmit}>
        <label>
          المبلغ
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </label>
        <label>
          السبب (اختياري)
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "..." : "تأكيد السحب"}
        </button>
      </form>
      {result && result.rejected && <div className="alert alert-error">{result.message}</div>}
      {result && !result.rejected && (
        <div className="alert alert-success">
          ✅ تم تسجيل السحب
          {result.warning && <div className="alert alert-warning">{result.warning}</div>}
        </div>
      )}
    </div>
  );
}
