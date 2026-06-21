import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { addLine } from "../services/lines";

export default function AddLine() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [number, setNumber] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await addLine(user.id, number.trim(), ownerName.trim());
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <h1>➕ إضافة خط جديد</h1>
      <form className="form-card" onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{error}</div>}
        <label>
          رقم الخط
          <input value={number} onChange={(e) => setNumber(e.target.value)} required />
        </label>
        <label>
          اسم صاحب الخط (اختياري)
          <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
        </label>
        <p className="hint">سيبدأ الخط بحد شهري 200,000 جنيه (ممكن تعديله بعد الإضافة)</p>
        <button type="submit" disabled={loading}>
          {loading ? "..." : "إضافة"}
        </button>
      </form>
    </div>
  );
}
