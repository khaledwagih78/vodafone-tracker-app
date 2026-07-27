import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deleteLine, editLine, getLine } from "../services/lines";

export default function EditLine() {
  const { lineId } = useParams();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [commissionRate, setCommissionRate] = useState("0");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLine(lineId).then((line) => {
      setCode(line.code || "");
      setDisplayName(line.display_name || "");
      setMonthlyLimit(line.monthly_limit);
      setCommissionRate(String(line.commission_rate ?? 0));
      setLoading(false);
    });
  }, [lineId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await editLine(lineId, {
        code,
        displayName,
        monthlyLimit: Number(monthlyLimit),
        commissionRate: Number(commissionRate),
      });
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
        <label>
          نسبة العمولة %
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={commissionRate}
            onChange={(e) => setCommissionRate(e.target.value)}
          />
        </label>
        <p className="hint">مثال: 0.5 يعني نصف بالمية على كل سحب وإيداع</p>
        <button type="submit">حفظ</button>
        <button type="button" className="btn-danger" onClick={handleDelete}>
          🗑 حذف الخط
        </button>
      </form>
    </div>
  );
}
