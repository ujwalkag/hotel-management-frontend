// pages/index.js
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function HomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role === "admin") {
      router.replace("/admin/dashboard");
    } else if (role === "staff" || role === "employee") {
      router.replace("/staff-dashboard");
    } else {
      router.replace("/login");
    }
  }, []);

  return null;
}

