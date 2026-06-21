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
          {user.id === ADMIN_USER_ID && <Link to="/admin">🛠 لوحة التحكم</Link>}
          <button onClick={signOut} className="link-button">
            🚪 خروج
          </button>
        </nav>
      )}
      {user && <TrialBanner />}
      <main>{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-line"
          element={
            <ProtectedRoute>
              <AddLine />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-line/:lineId"
          element={
            <ProtectedRoute>
              <EditLine />
            </ProtectedRoute>
          }
        />
        <Route
          path="/line/:lineId"
          element={
            <ProtectedRoute>
              <LineDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/line/:lineId/withdraw"
          element={
            <ProtectedRoute>
              <Withdraw />
            </ProtectedRoute>
          }
        />
        <Route
          path="/line/:lineId/deposit"
          element={
            <ProtectedRoute>
              <Deposit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/line/:lineId/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />
        <Route
          path="/summary"
          element={
            <ProtectedRoute>
              <Summary />
            </ProtectedRoute>
          }
        />
        <Route
          path="/limits"
          element={
            <ProtectedRoute>
              <MonthlyLimits />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Layout>
  );
}
