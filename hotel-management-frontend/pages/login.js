import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Login form submitted", email);

    try {
      const user = await login(email, password);
      console.log("✅ Login success, response:", user);

      if (user?.role === "admin") {
        router.push("/admin/dashboard");
      } else if (user?.role === "staff") {
        router.push("/staff/room-billing");
      } else {
        setError("Unknown user role");
      }
    } catch (err) {
      console.error("❌ Login failed:", err);
      setError("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="p-6 bg-white rounded shadow-md space-y-4">
        <h2 className="text-2xl font-bold text-center">Login</h2>
        {error && <p className="text-red-500">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 w-full"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 w-full"
          required
        />
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
          Login
        </button>
      </form>
    </div>
  );
}

