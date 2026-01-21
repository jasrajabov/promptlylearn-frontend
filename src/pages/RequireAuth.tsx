import { Outlet } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import AuthRequiredPage from "../pages/AuthRequiredPage";

const RequireAuth = () => {
  const { isAuthenticated, loading, logout } = useUser();

  if (loading) return null;
  if (!isAuthenticated) {
    logout();
    return <AuthRequiredPage />;
  }
  return <Outlet />;
};

export default RequireAuth;
