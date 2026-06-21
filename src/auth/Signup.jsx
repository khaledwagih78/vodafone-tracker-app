import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signUp(email, password);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>✅ تم التسجيل</h1>
          <p>تحقق من بريدك الإلكتروني لتأكيد الحساب، ثم سجّل الدخول.</p>
          <Link to="/login">الذهاب لتسجيل الدخول</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>🏦 اتقان كاش</h1>
        <p className="hint" style={{ marginTop: -10, textAlign: "center" }}>
          حساب جديد
        </p>
        {error && <div className="alert alert-error">{error}</div>}
        <label>
          البريد الإلكتروني
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          كلمة المرور
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "جاري التسجيل..." : "تسجيل"}
        </button>
        <p>
          عندك حساب؟ <Link to="/login">سجّل دخول</Link>
        </p>
      </form>
    </div>
  );
}
