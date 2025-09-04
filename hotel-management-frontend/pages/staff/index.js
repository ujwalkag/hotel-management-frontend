import { useEffect } from "react";
import { useRouter } from "next/router";

export default function StaffIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/staff/dashboard");
  }, []);

  return null;
}

