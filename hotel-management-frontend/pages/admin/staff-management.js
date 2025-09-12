import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import withRoleGuard from "@/hoc/withRoleGuard";
import Link from "next/link";

function StaffManagement() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.access) {
      fetchPayrollSummary();
    }
  }, [user]);

  const fetchPayrollSummary = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/staff-management/payroll-summary/", {
        headers: { Authorization: `Bearer ${user.access}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      } else {
        throw new Error('Failed to fetch payroll summary');
      }
    } catch (error) {
      console.error('Payroll summary error:', error);
      toast.error("Failed to load payroll summary");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center">Loading staff management...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          👥 Staff Management / कर्मचारी प्रबंधन
        </h1>
        <div className="flex gap-4">
          <Link href="/admin/dashboard">
            <a className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
              🏠 Home
            </a>
          </Link>
          <button
            onClick={logout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            {user?.email} • Logout
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Total Employees</div>
            <div className="text-2xl font-bold text-blue-600 mt-2">
              {summary.total_employees || 0}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Current Month Pay (Attendance)</div>
            <div className="text-2xl font-bold text-green-600 mt-2">
              ₹{(summary.total_paid?.current_month_attendance || 0).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Total Paid Till Date</div>
            <div className="text-2xl font-bold text-purple-600 mt-2">
              ₹{(summary.total_paid?.till_date || 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      )}

      {/* Main Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <Link href="/admin/staff-management/employees">
          <a className="block bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-center">
            <div className="text-3xl mb-2">👤</div>
            <div className="text-lg font-medium text-gray-900">Manage Employees</div>
            <div className="text-sm text-gray-600">Add, edit employees</div>
          </a>
        </Link>
        
        <Link href="/admin/staff-management/attendance">
          <a className="block bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-center">
            <div className="text-3xl mb-2">📅</div>
            <div className="text-lg font-medium text-gray-900">Daily Attendance</div>
            <div className="text-sm text-gray-600">Mark daily attendance</div>
          </a>
        </Link>
        
        <Link href="/admin/staff-management/designations">
          <a className="block bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-center">
            <div className="text-3xl mb-2">💼</div>
            <div className="text-lg font-medium text-gray-900">Designations</div>
            <div className="text-sm text-gray-600">Manage job roles</div>
          </a>
        </Link>
        
        <Link href="/admin/staff-management/payroll">
          <a className="block bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-center">
            <div className="text-3xl mb-2">💰</div>
            <div className="text-lg font-medium text-gray-900">Payroll Report</div>
            <div className="text-sm text-gray-600">View detailed reports</div>
          </a>
        </Link>
      </div>

      {/* Designation Wise Summary */}
      {summary?.designations && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Designation-wise Summary / पदवार सारांश
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Designation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employees
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Daily Wage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monthly Total (Attendance)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Till Date Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {summary.designations.map((designation) => (
                  <tr key={designation.name}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {designation.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {designation.employee_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{(designation.designation_daily_wage || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{(designation.monthly_total_by_attendance || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{(designation.till_date_total || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default withRoleGuard(StaffManagement, "admin");

