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
    const [saving, setSaving] = useState(false);

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

    const handleEdit = (employee) => {
        setForm({
            id: employee.id,
            name: employee.name,
            address: employee.address,
            aadhar_number: employee.aadhar_number || "",
            phone: employee.phone || "",
            designation: employee.designation,
            monthly_salary: employee.monthly_salary.toString(),
            daily_wage: employee.daily_wage ? employee.daily_wage.toString() : "",
            date_of_joining: employee.date_of_joining,
            is_active: employee.is_active,
        });
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
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
            setSaving(true);
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
                toast.success(`Employee ${form.id ? 'updated' : 'created'} successfully`);
                handleCancelEdit();
                fetchEmployees();
            } else {
                const errorData = await res.json();
                toast.error(errorData.detail || `Error ${form.id ? 'updating' : 'creating'} employee`);
            }
        } catch (error) {
            toast.error(`Error ${form.id ? 'updating' : 'creating'} employee`);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this employee? This action cannot be undone.")) return;

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

    const formatCurrency = (amount) => {
        return `₹${amount?.toLocaleString('en-IN') || '0'}`;
    };

    const selectedDesignation = designations.find(d => d.id == form.designation);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">
                    👤 Employee Management / कर्मचारी प्रबंधन
                </h1>

                <div className="mt-4 flex space-x-4">
                    <Link href="/admin/staff-management" className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                        ← Back to Staff Management
                    </Link>
                    <Link href="/admin/dashboard" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                        🏠 Home
                    </Link>
                </div>
            </div>

            {/* Add/Edit Form */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    {form.id ? "Edit Employee" : "Add New Employee"}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name *
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter full name"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter phone number"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Aadhar Number
                        </label>
                        <input
                            type="text"
                            value={form.aadhar_number}
                            onChange={(e) => setForm({ ...form, aadhar_number: e.target.value })}
                            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter Aadhar number"
                            maxLength="12"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address *
                        </label>
                        <textarea
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="2"
                            placeholder="Enter full address"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Designation *
                        </label>
                        <select
                            value={form.designation}
                            onChange={(e) => setForm({ ...form, designation: e.target.value })}
                            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">Select Designation *</option>
                            {designations.map((designation) => (
                                <option key={designation.id} value={designation.id}>
                                    {designation.name} ({formatCurrency(designation.monthly_salary)}/month, {formatCurrency(designation.daily_wage)}/day)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Monthly Salary * (₹)
                        </label>
                        <input
                            type="number"
                            value={form.monthly_salary}
                            onChange={(e) => setForm({ ...form, monthly_salary: e.target.value })}
                            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter monthly salary"
                            min="0"
                            step="100"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Daily Wage Override (₹)
                        </label>
                        <input
                            type="number"
                            value={form.daily_wage}
                            onChange={(e) => setForm({ ...form, daily_wage: e.target.value })}
                            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Override daily wage (optional)"
                            min="0"
                            step="50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date of Joining *
                        </label>
                        <input
                            type="date"
                            value={form.date_of_joining}
                            onChange={(e) => setForm({ ...form, date_of_joining: e.target.value })}
                            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div className="flex items-center">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={form.is_active}
                                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700">Active Employee</span>
                        </label>
                    </div>
                </div>

                {selectedDesignation && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">Selected Designation Details:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-700">
                            <div>
                                <strong>Designation:</strong> {selectedDesignation.name}
                            </div>
                            <div>
                                <strong>Default Monthly Salary:</strong> {formatCurrency(selectedDesignation.monthly_salary)}
                            </div>
                            <div>
                                <strong>Default Daily Wage:</strong> {formatCurrency(selectedDesignation.daily_wage)}
                            </div>
                        </div>
                        {selectedDesignation.description && (
                            <div className="mt-2">
                                <strong>Description:</strong> {selectedDesignation.description}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex space-x-4 mt-6">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : (form.id ? 'Update Employee' : 'Add Employee')}
                    </button>

                    {form.id && (
                        <button
                            onClick={handleCancelEdit}
                            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
                        >
                            Cancel Edit
                        </button>
                    )}
                </div>
            </div>

            {/* Employee List */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">
                        Employee List ({employees.length} employees)
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Employee Details
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Designation
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Salary & Wage
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Joining Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Earned
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
                                <tr key={employee.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                                            <div className="text-sm text-gray-500">{employee.phone || 'No phone'}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {employee.designation_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            <div>Monthly: {formatCurrency(employee.monthly_salary)}</div>
                                            <div>Daily: {formatCurrency(employee.effective_daily_wage)}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(employee.date_of_joining).toLocaleDateString('en-IN')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                        {formatCurrency(employee.total_pay)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            employee.is_active 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {employee.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <Link 
                                            href={`/admin/staff-management/employee/${employee.id}`}
                                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-xs hover:bg-blue-200"
                                        >
                                            View Details
                                        </Link>
                                        <button
                                            onClick={() => handleEdit(employee)}
                                            className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-xs hover:bg-yellow-200"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(employee.id)}
                                            className="bg-red-100 text-red-800 px-3 py-1 rounded text-xs hover:bg-red-200"
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

            {employees.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg shadow mt-6">
                    <div className="text-gray-500">
                        <p className="text-lg">No employees found</p>
                        <p className="text-sm">Add your first employee using the form above</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default withRoleGuard(EmployeeManagement, "admin");
