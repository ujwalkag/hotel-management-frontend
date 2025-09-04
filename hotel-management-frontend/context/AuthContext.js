import { createContext, useState, useEffect, useContext } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const access = sessionStorage.getItem("access");
    const refresh = sessionStorage.getItem("refresh");
    const email = sessionStorage.getItem("email");
    const role = sessionStorage.getItem("role");

    if (access && refresh && email && role) {
      const payload = parseJwt(access);
      const expiry = payload?.exp * 1000;
      if (Date.now() >= expiry) {
        refreshAccessToken(refresh);
      } else {
        setUser({ access, email, role });
        setLoading(false);
        const timeout = setTimeout(
          () => refreshAccessToken(refresh),
          expiry - Date.now() - 1000
        );
        return () => clearTimeout(timeout);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch {
      return null;
    }
  };

  const refreshAccessToken = async (refreshToken) => {
    try {
      const res = await fetch("/api/auth/token/refresh/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      if (!res.ok) {
        logout();
        return;
      }
      const data = await res.json();
      const newAccess = data.access;
      const email = sessionStorage.getItem("email");
      const role = sessionStorage.getItem("role");
      sessionStorage.setItem("access", newAccess);
      setUser({ access: newAccess, email, role });
      setLoading(false);
      const payload = parseJwt(newAccess);
      const nextExpiry = payload.exp * 1000;
      const timeout = setTimeout(
        () => refreshAccessToken(refreshToken),
        nextExpiry - Date.now() - 1000
      );
      return () => clearTimeout(timeout);
    } catch {
      logout();
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/token/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        toast.error("Invalid email or password!");
        setLoading(false);
        throw new Error("Invalid credentials");
      }
      const data = await res.json();
      const { access, refresh, email: userEmail, role } = data;
      sessionStorage.setItem("access", access);
      sessionStorage.setItem("refresh", refresh);
      sessionStorage.setItem("email", userEmail);
      sessionStorage.setItem("role", role);
      setUser({ access, email: userEmail, role });
      setLoading(false);
      if (role === "admin") {
        router.push("/admin/dashboard");
      } else if (role === "staff") {
        router.push("/staff/dashboard");
      } else {
        toast.error("Unknown user role.");
        router.push("/login");
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Login failed. Please try again.");
      setLoading(false);
    }
  };

  const logout = async () => {
    const refresh = sessionStorage.getItem("refresh");
    try {
      if (refresh) {
        await fetch("/api/users/logout/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
        });
      }
    } catch (err) {
      // Errors are ignored; always logout locally anyway
    }
    sessionStorage.clear();
    setUser(null);
    setLoading(false);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
