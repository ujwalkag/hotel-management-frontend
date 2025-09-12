import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import withRoleGuard from "@/hoc/withRoleGuard";
import Link from "next/link";

function DesignationManagement() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [designations, setDesignations] = useState([]);
  const [form, setForm] = useState({
    id: null,
    name: "",
    daily_wage: "",
    monthly_salary: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDesignations();
  }, []);

  const fetchDesignations = async () => {
    try {
      const res = await fetch("/api/staff-management/designations/", {
        headers: { Authorization: `Bearer ${user.access}` },
      });
      const data = await res.json();
      setDesignations(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      toast.error("Failed to load designations");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.daily_wage || !form.monthly_salary) {
      toast.error("Please fill all required fields");
      return;
    }

    const method = form.id ? "PATCH" : "POST";
    const url = form.id 
      ? `/api/staff-management/designations/${form.id}/`
      : "/api/staff-management/designations/";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.access}`,
        },
        body: JSON.stringify({
          ...form,
          daily_wage: parseFloat(form.daily_wage),
          monthly_salary: parseFloat(form.monthly_salary)
        }),
      });

      if (res.ok) {
        toast.success("Designation saved successfully");
        setForm({
          id: null,
          name: "",
          daily_wage: "",
          monthly_salary: "",
          description: "",
        });
        fetchDesignations();
      } else {
        const errorData = await res.json();
        toast.error(errorData.detail || "Error saving designation");
      }
    } catch (error) {
      toast.error("Error saving designation");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this designation? This will affect all employees with this designation.")) return;

    try {
      const res = await fetch(`/api/staff-management/designations/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.access}` },
      });

      if (res.ok) {
        toast.success("Designation deleted successfully");
        setDesignations(designations.filter((d) => d.id !== id));
      } else {
        toast.error("Error deleting designation");
      }
    } catch (error) {
      toast.error("Error deleting designation");
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          💼 Designation Management / पद प्रबंधन
        </h1>
        <div className="flex gap-4">
          <Link href="/admin/staff-management">
            <a className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
              ← Back to Staff Management
            </a>
          </Link>
          <Link href="/admin/dashboard">
            <a className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
              🏠 Home
            </a>
          </Link>
          <button
            onClick={logout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {form.id ? "Edit Designation" : "Add New Designation"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            placeholder="Designation Name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border px-3 py-2 rounded"
            required
          />
          <input
            type="number"
            placeholder="Daily Wage *"
            value={form.daily_wage}
            onChange={(e) => setForm({ ...form, daily_wage: e.target.value })}
            className="border px-3 py-2 rounded"
            min="0"
            step="50"
            required
          />
          <input
            type="number"
            placeholder="Monthly Salary *"
            value={form.monthly_salary}
            onChange={(e) => setForm({ ...form, monthly_salary: e.target.value })}
            className="border px-3 py-2 rounded"
            min="0"
            step="100"
            required
          />
          <textarea
            placeholder="Description (Optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="border px-3 py-2 rounded"
            rows="2"
          />
        </div>
        <div className="mt-4">
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            {form.id ? "Update" : "Add"} Designation
          </button>
          {form.id && (
            <button
              onClick={() => setForm({
                id: null,
                name: "",
                daily_wage: "",
                monthly_salary: "",
                description: "",
              })}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 ml-2"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Designations List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Designation List</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Daily Wage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monthly Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {designations.map((designation) => (
                <tr key={designation.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {designation.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{designation.daily_wage.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{designation.monthly_salary.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {designation.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setForm({
                        ...designation,
                        daily_wage: designation.daily_wage.toString(),
                        monthly_salary: designation.monthly_salary.toString()
                      })}
                      className="text-green-600 hover:text-green-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(designation.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default withRoleGuard(DesignationManagement, "admin");

