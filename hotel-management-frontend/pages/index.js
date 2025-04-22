// pages/index.js
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function HomeRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.push("/login");
  }, []);
  return null;
}

