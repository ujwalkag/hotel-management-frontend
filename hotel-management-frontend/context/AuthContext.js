import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [username, setUsername] = useState(null);

  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem("token");
      const storedRole = localStorage.getItem("role");
      const storedUsername = localStorage.getItem("username");

      if (storedToken && storedRole) {
        setToken(storedToken);
        setRole(storedRole);
        setUsername(storedUsername);
      }
    }
  }, []);

  const login = ({ token, role, username }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("username", username);
    setToken(token);
    setRole(role);
    setUsername(username);

    if (role === "admin") {
      router.push("/admin/dashboard");
    } else {
      router.push("/staff-dashboard");
    }
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setRole(null);
    setUsername(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ token, role, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

