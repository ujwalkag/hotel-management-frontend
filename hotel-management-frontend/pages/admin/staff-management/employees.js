import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import withRoleGuard from "@/hoc/withRoleGuard";
import Link from "next/link";

function EmployeeManagement() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [form, setForm] = useState({
    id: null,
    name: "",
    address: "",
    aadhar_number: "",
    phone: "",
    designation: "",
    monthly_salary: "",
    daily_wage: "",
    date_of_joining: "",
    is_active: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
    fetchDesignations();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/staff-management/employees/", {
        headers: { Authorization: `Bearer ${user.access}` },
      });
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      toast.error("Failed to load employees");
    }
  };

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
    if (!form.name || !form.address || !form.designation || !form.date_of_joining || !form.monthly_salary) {
      toast.error("Please fill all required fields");
      return;
    }

    const method = form.id ? "PATCH" : "POST";
    const url = form.id 
      ? `/api/staff-management/employees/${form.id}/`
      : "/api/staff-management/employees/";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.access}`,
        },
        body: JSON.stringify({
          ...form,
          monthly_salary: parseFloat(form.monthly_salary),
          daily_wage: form.daily_wage ? parseFloat(form.daily_wage) : null
        }),
      });

      if (res.ok) {
        toast.success("Employee saved successfully");
        setForm({
          id: null,
          name: "",
          address: "",
          aadhar_number: "",
          phone: "",
          designation: "",
          monthly_salary: "",
          daily_wage: "",
          date_of_joining: "",
          is_active: true,
        });
        fetchEmployees();
      } else {
        const errorData = await res.json();
        toast.error(errorData.detail || "Error saving employee");
      }
    } catch (error) {
      toast.error("Error saving employee");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this employee?")) return;

    try {
      const res = await fetch(`/api/staff-management/employees/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.access}` },
      });

      if (res.ok) {
        toast.success("Employee deleted successfully");
        setEmployees(employees.filter((e) => e.id !== id));
      } else {
        toast.error("Error deleting employee");
      }
    } catch (error) {
      toast.error("Error deleting employee");
    }
  };

  const selectedDesignation = designations.find(d => d.id == form.designation);

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          👤 Employee Management / कर्मचारी प्रबंधन
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
          {form.id ? "Edit Employee" : "Add New Employee"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <input
            placeholder="Employee Name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border px-3 py-2 rounded"
            required
          />
          <input
            placeholder="Phone Number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="border px-3 py-2 rounded"
          />
          <input
            placeholder="Aadhaar Number (Optional)"
            value={form.aadhar_number}
            onChange={(e) => setForm({ ...form, aadhar_number: e.target.value })}
            className="border px-3 py-2 rounded"
            maxLength="12"
          />
          <textarea
            placeholder="Address *"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="border px-3 py-2 rounded md:col-span-2"
            rows="2"
            required
          />
          <select
            value={form.designation}
            onChange={(e) => setForm({ ...form, designation: e.target.value })}
            className="border px-3 py-2 rounded"
            required
          >
            <option value="">Select Designation *</option>
            {designations.map((designation) => (
              <option key={designation.id} value={designation.id}>
                {designation.name} (₹{designation.monthly_salary}/month, ₹{designation.daily_wage}/day)
              </option>
            ))}
          </select>
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
          <input
            type="number"
            placeholder={`Daily Wage (Default: ₹${selectedDesignation?.daily_wage || 0})`}
            value={form.daily_wage}
            onChange={(e) => setForm({ ...form, daily_wage: e.target.value })}
            className="border px-3 py-2 rounded"
            min="0"
            step="50"
          />
          <input
            type="date"
            placeholder="Date of Joining *"
            value={form.date_of_joining}
            onChange={(e) => setForm({ ...form, date_of_joining: e.target.value })}
            className="border px-3 py-2 rounded"
            required
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Active Employee
          </label>
        </div>
        
        {selectedDesignation && (
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <p className="text-sm text-blue-800">
              <strong>Selected Designation:</strong> {selectedDesignation.name}<br/>
              <strong>Default Monthly Salary:</strong> ₹{selectedDesignation.monthly_salary.toLocaleString('en-IN')}<br/>
              <strong>Default Daily Wage:</strong> ₹{selectedDesignation.daily_wage}
            </p>
          </div>
        )}
        
        <div className="mt-4">
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            {form.id ? "Update" : "Add"} Employee
          </button>
          {form.id && (
            <button
              onClick={() => setForm({
                id: null, name: "", address: "", aadhar_number: "",
                phone: "", designation: "", monthly_salary: "", daily_wage: "",
                date_of_joining: "", is_active: true
              })}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 ml-2"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Employee List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Employee List</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Designation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monthly Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Daily Wage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joining Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Paid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {employee.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {employee.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.designation_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{employee.monthly_salary.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{employee.effective_daily_wage}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(employee.date_of_joining).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{employee.total_pay.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      employee.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {employee.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link href={`/admin/staff-management/employee/${employee.id}`}>
                      <a className="text-indigo-600 hover:text-indigo-900 mr-3">
                        View Details
                      </a>
                    </Link>
                    <button
                      onClick={() => setForm({
                        ...employee,
                        monthly_salary: employee.monthly_salary.toString(),
                        daily_wage: employee.daily_wage ? employee.daily_wage.toString() : ""
                      })}
                      className="text-green-600 hover:text-green-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(employee.id)}
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

export default withRoleGuard(EmployeeManagement, "admin");

