import { Outlet } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import AuthRequiredPage from "../pages/AuthRequiredPage";

const RequireAuth = () => {
  const { isAuthenticated, loading, logout } = useUser();

  if (loading) return null;
  console.log("Checking authentication status in RequireAuth.");
  if (!isAuthenticated) {
    logout();
    return <AuthRequiredPage />;
  }
  console.log("User is authenticated, rendering protected route.");
  return <Outlet />;
};

export default RequireAuth;
