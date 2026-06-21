import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen">...جاري التحميل</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
