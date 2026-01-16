import { useEffect } from "react";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";

export function useRequirePremium() {
  const { user, loading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user?.membership_active) {
      navigate("/upgrade");
    }
  }, [user, loading, navigate]);
}
