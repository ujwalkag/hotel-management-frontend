
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
    
    // Get ALL user data from sessionStorage
    const userData = {
      email: sessionStorage.getItem("email"),
      role: sessionStorage.getItem("role"),
      can_create_orders: sessionStorage.getItem("can_create_orders") === 'true',
      can_generate_bills: sessionStorage.getItem("can_generate_bills") === 'true',
      can_access_kitchen: sessionStorage.getItem("can_access_kitchen") === 'true',
      first_name: sessionStorage.getItem("first_name"),
      last_name: sessionStorage.getItem("last_name")
    };

    if (access && refresh && userData.email && userData.role) {
      const payload = parseJwt(access);
      const expiry = payload?.exp * 1000;
      if (Date.now() >= expiry) {
        refreshAccessToken(refresh);
      } else {
        setUser({ access, ...userData });
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
      
      // Get stored user data
      const userData = {
        email: sessionStorage.getItem("email"),
        role: sessionStorage.getItem("role"),
        can_create_orders: sessionStorage.getItem("can_create_orders") === 'true',
        can_generate_bills: sessionStorage.getItem("can_generate_bills") === 'true',
        can_access_kitchen: sessionStorage.getItem("can_access_kitchen") === 'true',
        first_name: sessionStorage.getItem("first_name"),
        last_name: sessionStorage.getItem("last_name")
      };
      
      sessionStorage.setItem("access", newAccess);
      setUser({ access: newAccess, ...userData });
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
      
      // Store ALL user data in sessionStorage
      sessionStorage.setItem("access", data.access);
      sessionStorage.setItem("refresh", data.refresh);
      sessionStorage.setItem("email", data.email);
      sessionStorage.setItem("role", data.role);
      sessionStorage.setItem("can_create_orders", data.can_create_orders?.toString() || 'false');
      sessionStorage.setItem("can_generate_bills", data.can_generate_bills?.toString() || 'false');
      sessionStorage.setItem("can_access_kitchen", data.can_access_kitchen?.toString() || 'false');
      sessionStorage.setItem("first_name", data.first_name || '');
      sessionStorage.setItem("last_name", data.last_name || '');
      
      const userData = {
        access: data.access,
        email: data.email,
        role: data.role,
        can_create_orders: data.can_create_orders || false,
        can_generate_bills: data.can_generate_bills || false,
        can_access_kitchen: data.can_access_kitchen || false,
        first_name: data.first_name || '',
        last_name: data.last_name || ''
      };
      
      setUser(userData);
      setLoading(false);
      
      // Enhanced routing based on role and permissions
      if (data.role === "admin") {
        router.push("/admin/dashboard");
      } else if (data.role === "staff") {
        router.push("/staff/dashboard");
      } else if (data.role === "waiter") {
        router.push("/waiter/mobile-orders");
      } else if (data.role === "biller") {
        router.push("/biller/dashboard");
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
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
