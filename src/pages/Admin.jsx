import { useEffect, useState } from "react";
import { getAllProfiles, setActive, trialDaysLeft } from "../services/profile";

function statusInfo(profile) {
  if (profile.is_active) return { emoji: "🟢", label: "مفعّل" };
  const days = trialDaysLeft(profile);
  if (days <= 0) return { emoji: "🔴", label: "التجربة خلصت" };
  return { emoji: "🟡", label: `تجربة - باقي ${days} يوم` };
}

export default function Admin() {
  const [profiles, setProfiles] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      setProfiles(await getAllProfiles());
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleActive(userId, current) {
    await setActive(userId, !current);
    load();
  }

  if (error) return <div className="page alert alert-error">{error}</div>;
  if (!profiles) return <p>...جاري التحميل</p>;

  return (
    <div className="page">
      <h1>🛠 لوحة تحكم المستخدمين</h1>
      <table className="summary-table">
        <thead>
          <tr>
            <th></th>
            <th>الإيميل</th>
            <th>تاريخ التسجيل</th>
            <th>الحالة</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((p) => {
            const status = statusInfo(p);
            return (
              <tr key={p.id}>
                <td>{status.emoji}</td>
                <td>{p.email || p.id}</td>
                <td>{new Date(p.created_at).toLocaleDateString("ar-EG")}</td>
                <td>{status.label}</td>
                <td>
                  <button
                    className={p.is_active ? "btn-danger" : "btn-success"}
                    onClick={() => toggleActive(p.id, p.is_active)}
                  >
                    {p.is_active ? "إلغاء التفعيل" : "✅ تفعيل"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
