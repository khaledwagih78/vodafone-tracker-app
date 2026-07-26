import { Link, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import Login from "./auth/Login";
import Signup from "./auth/Signup";
import ForgotPassword from "./auth/ForgotPassword";
import ResetPassword from "./auth/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import TrialBanner from "./components/TrialBanner";
import Dashboard from "./pages/Dashboard";
import AddLine from "./pages/AddLine";
import EditLine from "./pages/EditLine";
import LineDetail from "./pages/LineDetail";
import Withdraw from "./pages/Withdraw";
import Deposit from "./pages/Deposit";
import Summary from "./pages/Summary";
import MonthlyLimits from "./pages/MonthlyLimits";
import History from "./pages/History";
import AllHistory from "./pages/AllHistory";
import Reports from "./pages/Reports";
import Transfer from "./pages/Transfer";
import Admin from "./pages/Admin";
import { ADMIN_USER_ID } from "./services/profile";

function Layout({ children }) {
  const { user, signOut } = useAuth();
  return (
    <div className="app-shell">
      {user && (
        <nav className="top-nav">
          <span className="brand">🏦 اتقان كاش</span>
          <Link to="/">📱 الخطوط</Link>
          <Link to="/summary">📊 ملخص</Link>
          <Link to="/limits">📈 الحدود</Link>
          <Link to="/history">📋 السجل</Link>
          <Link to="/reports">💰 التقارير</Link>
          <Link to="/transfer">🔄 نقل</Link>
          {user.id === ADMIN_USER_ID && <Link to="/admin">🛠 لوحة التحكم</Link>}
          <button onClick={signOut} className="link-button">🚪 خروج</button>
        </nav>
      )}
      {user && <TrialBanner />}
      <main>{children}</main>
    </div>
  );
}

function P({ element }) {
  return <ProtectedRoute>{element}</ProtectedRoute>;
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<P element={<Dashboard />} />} />
        <Route path="/add-line" element={<P element={<AddLine />} />} />
        <Route path="/edit-line/:lineId" element={<P element={<EditLine />} />} />
        <Route path="/line/:lineId" element={<P element={<LineDetail />} />} />
        <Route path="/line/:lineId/withdraw" element={<P element={<Withdraw />} />} />
        <Route path="/line/:lineId/deposit" element={<P element={<Deposit />} />} />
        <Route path="/line/:lineId/history" element={<P element={<History />} />} />
        <Route path="/summary" element={<P element={<Summary />} />} />
        <Route path="/limits" element={<P element={<MonthlyLimits />} />} />
        <Route path="/history" element={<P element={<AllHistory />} />} />
        <Route path="/reports" element={<P element={<Reports />} />} />
        <Route path="/transfer" element={<P element={<Transfer />} />} />
        <Route path="/admin" element={<P element={<Admin />} />} />
      </Routes>
    </Layout>
  );
}
