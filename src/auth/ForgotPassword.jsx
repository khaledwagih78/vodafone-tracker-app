import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>📩 تم الإرسال</h1>
          <p>لو الإيميل ده مسجّل عندنا، هيوصلك لينك لتغيير كلمة المرور.</p>
          <Link to="/login">رجوع لتسجيل الدخول</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>🔑 نسيت كلمة المرور؟</h1>
        {error && <div className="alert alert-error">{error}</div>}
        <label>
          البريد الإلكتروني
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "جاري الإرسال..." : "ابعت لينك إعادة التعيين"}
        </button>
        <p>
          <Link to="/login">رجوع لتسجيل الدخول</Link>
        </p>
      </form>
    </div>
  );
}
