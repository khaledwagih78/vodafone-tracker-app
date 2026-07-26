import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { ensureMonthlyReset, getLines, transfer } from "../services/lines";

export default function Transfer() {
  const { user } = useAuth();
  const [lines, setLines] = useState([]);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    ensureMonthlyReset(user.id)
      .then(() => getLines(user.id))
      .then((ls) => {
        setLines(ls);
        if (ls.length >= 1) setFromId(ls[0].id);
        if (ls.length >= 2) setToId(ls[1].id);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!fromId || !toId || !amount) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await transfer(user.id, fromId, toId, Number(amount), note);
      setResult(res);
      if (!res.rejected) {
        setAmount("");
        setNote("");
        // Reload lines to show updated balances
        const updated = await getLines(user.id);
        setLines(updated);
      }
    } catch (err) {
      setResult({ rejected: true, message: err.message });
    } finally {
      setLoading(false);
    }
  }

  const fromLine = lines.find((l) => l.id === fromId);
  const toLine = lines.find((l) => l.id === toId);

  return (
    <div className="page">
      <h1>🔄 نقل بين الخطوط</h1>

      {lines.length < 2 && (
        <p className="alert alert-warning">تحتاج خطين على الأقل لتنفيذ النقل</p>
      )}

      {lines.length >= 2 && (
        <form className="form-card" onSubmit={handleSubmit}>
          <label>
            من خط
            <select value={fromId} onChange={(e) => setFromId(e.target.value)}>
              {lines.map((l) => (
                <option key={l.id} value={l.id}>{l.display_name || l.number}</option>
              ))}
            </select>
          </label>
          {fromLine && (
            <p className="hint">
              رصيده: {Number(fromLine.balance).toLocaleString()} ج ·
              متبقي سحب: {Number(fromLine.remaining_withdraw).toLocaleString()} ج
            </p>
          )}

          <label>
            إلى خط
            <select value={toId} onChange={(e) => setToId(e.target.value)}>
              {lines.filter((l) => l.id !== fromId).map((l) => (
                <option key={l.id} value={l.id}>{l.display_name || l.number}</option>
              ))}
            </select>
          </label>
          {toLine && (
            <p className="hint">
              رصيده: {Number(toLine.balance).toLocaleString()} ج ·
              متبقي إيداع: {Number(toLine.remaining_deposit).toLocaleString()} ج
            </p>
          )}

          <label>
            المبلغ
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </label>

          <label>
            ملاحظة (اختياري)
            <input value={note} onChange={(e) => setNote(e.target.value)} />
          </label>

          <button type="submit" disabled={loading || fromId === toId}>
            {loading ? "..." : "🔄 تأكيد النقل"}
          </button>
        </form>
      )}

      {result && result.rejected && (
        <div className="alert alert-error" style={{ marginTop: 12 }}>{result.message}</div>
      )}
      {result && !result.rejected && (
        <div className="alert alert-success" style={{ marginTop: 12 }}>
          ✅ تم النقل بنجاح — تم تحديث الرصيد في كلا الخطين
        </div>
      )}
    </div>
  );
}
