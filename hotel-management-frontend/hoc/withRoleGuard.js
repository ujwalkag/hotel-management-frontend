import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { useEffect } from "react";

const withRoleGuard = (Component, allowedRoles, requiredPermissions = []) => {
  const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return function RoleProtectedComponent(props) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && typeof user !== "undefined") {
        if (!user) {
          router.replace("/login");
          return;
        }
        
        // Check role
        if (!allowed.includes(user.role)) {
          router.replace("/unauthorized");
          return;
        }
        
        // Check specific permissions
        for (const permission of requiredPermissions) {
          if (!user[permission]) {
            router.replace("/unauthorized");
            return;
          }
        }
      }
    }, [user, loading, router]);

    if (loading || typeof user === "undefined") {
      return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    if (!user || !allowed.includes(user.role)) {
      return null;
    }

    // Check permissions
    for (const permission of requiredPermissions) {
      if (!user[permission]) {
        return null;
      }
    }

    return <Component {...props} />;
  };
};

export default withRoleGuard;
