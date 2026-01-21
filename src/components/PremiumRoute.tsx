import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

const PremiumRoute: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading } = useUser();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (user?.membership_status !== "ACTIVE") {
    return <Navigate to="/upgrade" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default PremiumRoute;
