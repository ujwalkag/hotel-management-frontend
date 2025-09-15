import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import withRoleGuard from "@/hoc/withRoleGuard";

function Employees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    id: null,
    username: "",
    email: "",
    password: "",
    role: "staff",
    is_active: true,
    can_create_orders: false,
    can_generate_bills: false,
    can_access_kitchen: false,
  });

  const roles = ["admin", "staff", "waiter"];

  useEffect(() => {
    if (user?.access) {
      fetchEmployees();
    }
  }, [user]);

  async function fetchEmployees() {
    try {
      setLoading(true);
      const res = await fetch("/api/users/staff/", {
        headers: { Authorization: `Bearer ${user.access}` },
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      // Defensive normalization
      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data && Array.isArray(data.results)) {
        list = data.results;
      } else if (data && typeof data === 'object') {
        list = [];
      }
      
      setEmployees(list);
    } catch (error) {
      console.error('Fetch employees error:', error);
      setEmployees([]);
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!form.username && !form.id) {
      toast.error("Username is required");
      return;
    }
    
    if (!form.email && !form.id) {
      toast.error("Email is required");
      return;
    }
    
    if (!form.password && !form.id) {
      toast.error("Password is required for new users");
      return;
    }

    const method = form.id ? "PATCH" : "POST";
    const url = form.id 
    ? `/api/users/staff/${form.id}/`  // This should now work with ModelViewSet
    : "/api/users/staff/";

    let payload = {
      role: form.role,
      is_active: form.is_active,
      can_create_orders: form.can_create_orders,
      can_generate_bills: form.can_generate_bills,
      can_access_kitchen: form.can_access_kitchen,
    };

    if (!form.id) {
      payload = {
        ...payload,
        username: form.username,
        email: form.email,
        password: form.password,
      };
    } else if (form.password) {
      payload.password = form.password;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.access}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Saved successfully");
        setForm({
          id: null,
          username: "",
          email: "",
          password: "",
          role: "staff",
          is_active: true,
          can_create_orders: false,
          can_generate_bills: false,
          can_access_kitchen: false,
        });
        fetchEmployees();
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.error || "Error saving employee");
      }
    } catch (error) {
      console.error('Save employee error:', error);
      toast.error("Error saving employee");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this employee?")) return;
    
    try {
      const res = await fetch(`/api/users/staff/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.access}` },
      });
      
      if (res.ok) {
        toast.success("Deleted successfully");
        setEmployees(prev => Array.isArray(prev) ? prev.filter(e => e.id !== id) : []);
      } else {
        toast.error("Error deleting");
      }
    } catch (error) {
      console.error('Delete employee error:', error);
      toast.error("Error deleting");
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center">Loading employees...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Manage Employees</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {!form.id && (
          <>
            <input
              placeholder="Username"
              value={form.username || ""}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="border px-3 py-2 rounded"
            />
            <input
              placeholder="Email"
              value={form.email || ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="border px-3 py-2 rounded"
              type="email"
            />
          </>
        )}
        <input
          placeholder={form.id ? "New Password (optional)" : "Password"}
          value={form.password || ""}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="border px-3 py-2 rounded"
          type="password"
        />
        <select
          value={form.role || "staff"}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="border px-3 py-2 rounded"
        >
          {roles.map((r) => (
            <option key={r} value={r}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          Active
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!form.can_create_orders}
            onChange={(e) => setForm({ ...form, can_create_orders: e.target.checked })}
          />
          Can Create Orders
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!form.can_generate_bills}
            onChange={(e) => setForm({ ...form, can_generate_bills: e.target.checked })}
          />
          Can Generate Bills
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!form.can_access_kitchen}
            onChange={(e) => setForm({ ...form, can_access_kitchen: e.target.checked })}
          />
          Can Access Kitchen
        </label>
      </div>

      <button
        onClick={handleSave}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-6 hover:bg-blue-700"
      >
        {form.id ? "Update" : "Add"} Employee
      </button>

      <div>
        {Array.isArray(employees) && employees.length > 0 ? (
          <ul className="space-y-2">
            {employees.map((emp) => (
              <li
                key={emp.id}
                className="border p-4 rounded flex justify-between"
              >
                <div>
                  <p className="font-semibold">
                    {emp.username || emp.email || 'Unknown'} ({emp.role || 'No role'})
                  </p>
                  <p className="text-sm">
                    Orders: {emp.can_create_orders ? "✔" : "✖"}, Bills:{" "}
                    {emp.can_generate_bills ? "✔" : "✖"}, Kitchen:{" "}
                    {emp.can_access_kitchen ? "✔" : "✖"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setForm({ ...emp, password: "" })}
                    className="text-green-600 hover:text-green-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(emp.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center text-gray-500 py-8">
            No employees found. Add one above.
          </div>
        )}
      </div>
    </div>
  );
}

export default withRoleGuard(Employees, "admin");

