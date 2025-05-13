import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { useEffect } from "react";

const withRoleGuard = (Component, allowedRoles) => {
  return function RoleProtectedComponent(props) {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!user) {
        router.push('/login');
      } else if (!allowedRoles.includes(user.role)) {
        router.push('/');
      }
    }, [user, router]);

    if (!user) return null; // Optionally show a loading spinner
    if (!allowedRoles.includes(user.role)) return null;

    return <Component {...props} />;
  };
};

export default withRoleGuard;

