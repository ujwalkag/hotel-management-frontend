import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { useEffect } from "react";

const withRoleGuard = (Component, allowedRoles) => {
  const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return function RoleProtectedComponent(props) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && typeof user !== "undefined") {
        if (!user) {
          router.replace("/login");
        } else if (!allowed.includes(user.role)) {
          router.replace("/unauthorized");
        }
      }
    }, [user, loading, router]);

    if (loading || typeof user === "undefined") {
      return <p className="text-center mt-10 text-gray-500">Loading...</p>;
    }

    if (!user || !allowed.includes(user.role)) {
      return null;
    }

    return <Component {...props} />;
  };
};

export default withRoleGuard;
