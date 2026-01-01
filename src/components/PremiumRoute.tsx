import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

const PremiumRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useUser();

    if (loading) {
        return <div>Loading...</div>;
    }
    console.log("Checking premium access for user:", user);

    if (!user?.membership_active) {
        console.log("User does not have an active membership. Redirecting to upgrade page.");
        return <Navigate to="/upgrade" replace />;
    }

    return children ? <>{children}</> : <Outlet />;
};

export default PremiumRoute;