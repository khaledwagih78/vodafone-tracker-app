import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { getProfile, trialDaysLeft } from "../services/profile";

export default function TrialBanner() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!user) return;
    getProfile(user.id).then(setProfile).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!profile || profile.is_active) return null;

  const days = trialDaysLeft(profile);
  return (
    <div className="alert alert-warning" style={{ margin: "0 20px", marginTop: 10 }}>
      ⏰ متبقي {days} {days === 1 ? "يوم" : "أيام"} من الفترة التجريبية المجانية
    </div>
  );
}
