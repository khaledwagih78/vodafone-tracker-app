import { useAuth } from "../auth/AuthContext";

export default function TrialExpired() {
  const { signOut } = useAuth();

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>🏦 اتقان كاش</h1>
        <p style={{ textAlign: "center" }}>⏰ انتهت فترة التجربة المجانية</p>
        <p className="hint" style={{ textAlign: "center" }}>
          للتفعيل وتفعيل حسابك بشكل دائم، تواصل معنا.
        </p>
        <a
          href="mailto:khaledwagih78@gmail.com?subject=تفعيل حساب اتقان كاش"
          className="btn btn-success"
          style={{ justifyContent: "center" }}
        >
          📧 تواصل للتفعيل
        </a>
        <button onClick={signOut} className="link-button" style={{ margin: "0 auto" }}>
          🚪 خروج
        </button>
      </div>
    </div>
  );
}
