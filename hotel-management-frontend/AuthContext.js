// context/AuthContext.js
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/router";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({ token: null, role: null, email: null });
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      const email = localStorage.getItem("email");

      if (token && role) {
        setAuth({ token, role, email });
      }

      setIsLoaded(true); // ✅ mark context ready
    }
  }, []);

  const login = ({ token, role, email }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("email", email);
    setAuth({ token, role, email });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    setAuth({ token: null, role: null, email: null });
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout, isLoaded }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

