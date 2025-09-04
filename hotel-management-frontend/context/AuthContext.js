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
    
    if (access && refresh) {
      const userData = {
        email: sessionStorage.getItem("email"),
        role: sessionStorage.getItem("role"),
        can_create_orders: sessionStorage.getItem("can_create_orders") === 'true',
        can_generate_bills: sessionStorage.getItem("can_generate_bills") === 'true',
        can_access_kitchen: sessionStorage.getItem("can_access_kitchen") === 'true',
        is_active: sessionStorage.getItem("is_active") === 'true'
      };

      if (userData.email && userData.role) {
        const payload = parseJwt(access);
        const expiry = payload?.exp * 1000;
        if (Date.now() >= expiry) {
          refreshAccessToken(refresh);
        } else {
          setUser({ access, ...userData });
          setLoading(false);
        }
      } else {
        setLoading(false);
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
      
      const userData = {
        email: sessionStorage.getItem("email"),
        role: sessionStorage.getItem("role"),
        can_create_orders: sessionStorage.getItem("can_create_orders") === 'true',
        can_generate_bills: sessionStorage.getItem("can_generate_bills") === 'true',
        can_access_kitchen: sessionStorage.getItem("can_access_kitchen") === 'true',
        is_active: sessionStorage.getItem("is_active") === 'true'
      };
      
      sessionStorage.setItem("access", newAccess);
      setUser({ access: newAccess, ...userData });
      setLoading(false);
    } catch {
      logout();
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      console.log('Attempting login for:', email);
      
      const res = await fetch("/api/auth/token/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      console.log('Login response status:', res.status);
      
      if (!res.ok) {
        let errorMessage = "Login failed";
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorData.detail || "Invalid credentials";
        } catch {
          // If response is not JSON (HTML error page), show generic message
          errorMessage = "Server error. Please try again.";
        }
        console.error('Login error:', errorMessage);
        toast.error(errorMessage);
        setLoading(false);
        throw new Error(errorMessage);
      }
      
      const data = await res.json();
      console.log('Login success:', { email: data.email, role: data.role });
      
      // Store all user data
      sessionStorage.setItem("access", data.access);
      sessionStorage.setItem("refresh", data.refresh);
      sessionStorage.setItem("email", data.email);
      sessionStorage.setItem("role", data.role);
      sessionStorage.setItem("can_create_orders", (data.can_create_orders || false).toString());
      sessionStorage.setItem("can_generate_bills", (data.can_generate_bills || false).toString());
      sessionStorage.setItem("can_access_kitchen", (data.can_access_kitchen || false).toString());
      sessionStorage.setItem("is_active", (data.is_active || true).toString());
      
      const userData = {
        access: data.access,
        email: data.email,
        role: data.role,
        can_create_orders: data.can_create_orders || false,
        can_generate_bills: data.can_generate_bills || false,
        can_access_kitchen: data.can_access_kitchen || false,
        is_active: data.is_active || true
      };
      
      setUser(userData);
      setLoading(false);
      
      toast.success(`Welcome ${data.role}!`);
      
      // Route based on role
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
      console.log("Logout error (ignored):", err);
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
