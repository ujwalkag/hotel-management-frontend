// context/AuthContext.js
import { createContext, useState, useEffect, useContext } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const access = localStorage.getItem("access");
    const email = localStorage.getItem("email");
    const role = localStorage.getItem("role");

    if (access && email && role) {
      setUser({ access, email, role });
    }
  }, []);

  const login = async (email, password) => {
    try {
      const res = await fetch("/api/auth/token/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        toast.error("Invalid email or password!");
        throw new Error("Invalid credentials");
      }

      const data = await res.json();
      console.log("✅ Login success:", data);

      // Save credentials
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      localStorage.setItem("email", data.email);
      localStorage.setItem("role", data.role);

      setUser({ access: data.access, email: data.email, role: data.role });

      // ✅ Redirect by role
      if (data.role === "admin") {
        router.push("/admin/dashboard");
      } else if (data.role === "staff") {
        router.push("/staff/dashboard");
      } else {
        toast.error("Unknown user role.");
        router.push("/login");
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Login failed. Please try again.");
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

