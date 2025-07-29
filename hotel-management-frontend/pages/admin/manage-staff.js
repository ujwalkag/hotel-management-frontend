import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import withRoleGuard from "@/hoc/withRoleGuard";

function ManageStaff() {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const fetchStaff = async () => {
    try {
      const res = await fetch("/api/users/staff/", {
        headers: {
          Authorization: `Bearer ${user?.access}`,
        },
      });
      const data = await res.json();
      setStaff(data);
    } catch (err) {
      console.error("Error fetching staff list");
    }
  };

  const addStaff = async () => {
    if (!email || !password) return;

    try {
      const res = await fetch("/api/users/staff/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.access}`,
        },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        setMessage("✅ Staff added / कर्मचारी जोड़ा गया");
        setEmail("");
        setPassword("");
        fetchStaff();
      } else {
        const data = await res.json();
        setMessage(`❌ Error: ${data?.error || "Something went wrong"}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Network error / नेटवर्क त्रुटि");
    }
  };

  const deleteStaff = async (id) => {
    try {
      await fetch(`/api/users/staff/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user?.access}`,
        },
      });
      fetchStaff();
    } catch (err) {
      console.error("Failed to delete staff");
    }
  };

  useEffect(() => {
    if (user?.access) fetchStaff();
  }, [user]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">👥 Manage Staff / स्टाफ प्रबंधन</h1>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-lg font-semibold mb-2">➕ Add Staff / कर्मचारी जोड़ें</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            placeholder="Email / ईमेल"
            onChange={(e) => setEmail(e.target.value)}
            className="border px-4 py-2 rounded w-full"
          />
          <input
            type="password"
            value={password}
            placeholder="Password / पासवर्ड"
            onChange={(e) => setPassword(e.target.value)}
            className="border px-4 py-2 rounded w-full"
          />
          <button
            onClick={addStaff}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Add / जोड़ें
          </button>
        </div>
        {message && <p className="mt-2 text-sm text-green-600">{message}</p>}
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-3">📋 Staff List / स्टाफ सूची</h2>
        <ul className="divide-y">
          {staff.map((s) => (
            <li key={s.id} className="py-2 flex justify-between items-center">
              <span>{s.email}</span>
              <button
                onClick={() => deleteStaff(s.id)}
                className="bg-red-500 text-white px-3 py-1 rounded text-sm"
              >
                Delete / हटाएं
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default withRoleGuard(ManageStaff, "admin");

