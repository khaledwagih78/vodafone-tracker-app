import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ADMIN_USER_ID, ensureProfile, getProfile, isAccessAllowed } from "../services/profile";
import TrialExpired from "../pages/TrialExpired";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState(undefined);

  useEffect(() => {
    if (!user) return;
    ensureProfile(user.id, user.email)
      .then(() => getProfile(user.id))
      .then(setProfile);
  }, [user]);

  if (loading) return <div className="loading-screen">...جاري التحميل</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.id === ADMIN_USER_ID) return children;
  if (profile === undefined) return <div className="loading-screen">...جاري التحميل</div>;
  if (!isAccessAllowed(profile)) return <TrialExpired />;

  return children;
}
