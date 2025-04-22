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

      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      if (!token) {
        router.replace("/login");
      } else if (!allowedRoles.includes(role)) {
        router.replace("/unauthorized");
      } else {
        setChecked(true);
      }
    }, []);

    if (!checked) return <div className="text-center mt-12">Loading...</div>;
    return <Component {...props} />;
  };
}

