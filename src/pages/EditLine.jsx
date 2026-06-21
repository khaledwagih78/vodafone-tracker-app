import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deleteLine, editLine, getLine } from "../services/lines";

export default function EditLine() {
  const { lineId } = useParams();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLine(lineId).then((line) => {
      setCode(line.code || "");
      setDisplayName(line.display_name || "");
      setMonthlyLimit(line.monthly_limit);
      setLoading(false);
    });
  }, [lineId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await editLine(lineId, { code, displayName, monthlyLimit: Number(monthlyLimit) });
      navigate(`/line/${lineId}`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete() {
    if (!confirm("هل أنت متأكد من حذف الخط؟")) return;
    await deleteLine(lineId);
    navigate("/");
  }

  if (loading) return <p>...جاري التحميل</p>;

  return (
    <div className="page">
      <h1>✏️ تعديل الخط</h1>
      <form className="form-card" onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{error}</div>}
        <label>
          الكود
          <input value={code} onChange={(e) => setCode(e.target.value)} />
        </label>
        <label>
          الاسم
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </label>
        <label>
          الحد الشهري
          <input
            type="number"
            value={monthlyLimit}
            onChange={(e) => setMonthlyLimit(e.target.value)}
          />
        </label>
        <button type="submit">حفظ</button>
        <button type="button" className="btn-danger" onClick={handleDelete}>
          🗑 حذف الخط
        </button>
      </form>
    </div>
  );
}
