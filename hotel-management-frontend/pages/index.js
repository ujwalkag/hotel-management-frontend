import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";

export default function HomeRedirect() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        router.replace("/admin/dashboard");
      } else if (user.role === "staff") {
        router.replace("/staff/dashboard");
      } else {
        router.replace("/login");
      }
    } else {
      router.replace("/login");
    }
  }, [user]);

  return null;
}
