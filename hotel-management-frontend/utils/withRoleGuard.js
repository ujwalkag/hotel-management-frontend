// utils/withRoleGuard.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";

export default function withRoleGuard(Component, allowedRoles = []) {
  return function ProtectedPage(props) {
    const { auth } = useAuth();
    const router = useRouter();
    const [checked, setChecked] = useState(false);

    useEffect(() => {
      if (typeof window === "undefined") return;

      const isTokenPresent = !!auth.token;
      const hasAccess = allowedRoles.includes(auth.role);

      if (!isTokenPresent) {
        router.replace("/login");
      } else if (!hasAccess) {
        router.replace("/unauthorized");
      } else {
        setChecked(true);
      }
    }, [auth]);

    if (!checked) return <div className="text-center mt-10">Loading...</div>;

    return <Component {...props} />;
  };
}

