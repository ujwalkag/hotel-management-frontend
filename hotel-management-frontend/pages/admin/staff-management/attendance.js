import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import withRoleGuard from "@/hoc/withRoleGuard";
import Link from "next/link";

function AttendanceManagement() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.access) {
      fetchAttendanceSheet();
    }
  }, [user, selectedDate]);

  const fetchAttendanceSheet = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/staff-management/attendance-sheet/?date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${user.access}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAttendanceData(data.attendance || []);
      } else {
        throw new Error('Failed to fetch attendance');
      }
    } catch (error) {
      console.error('Attendance fetch error:', error);
      toast.error("Failed to load attendance sheet");
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (employeeId, field, value) => {
    setAttendanceData(prev => 
      prev.map(emp => 
        emp.employee_id === employeeId 
          ? { ...emp, [field]: value }
          : emp
      )
    );
  };

  const saveAttendance = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/staff-management/mark-attendance/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access}`,
        },
        body: JSON.stringify({
          date: selectedDate,
          attendance: attendanceData
        }),
      });

      if (res.ok) {
        toast.success("Attendance saved successfully");
      } else {
        throw new Error('Failed to save attendance');
      }
    } catch (error) {
      console.error('Save attendance error:', error);
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center">Loading attendance...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          📅 Daily Attendance / दैनिक उपस्थिति
        </h1>
        <div className="flex gap-4">
          <Link href="/admin/staff-management">
            <a className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
              ← Back
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

      {/* Date Selector */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex items-center gap-4">
          <label className="text-lg font-medium">Select Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border px-3 py-2 rounded"
          />
          <button
            onClick={saveAttendance}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "💾 Save Attendance"}
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Attendance for {new Date(selectedDate).toLocaleDateString('en-IN')}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee Name
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
                  Present/Absent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceData.map((employee) => (
                <tr key={employee.employee_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {employee.employee_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.designation}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{employee.monthly_salary?.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{employee.daily_wage?.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <select
                      value={employee.is_present ? 'true' : 'false'}
                      onChange={(e) => handleAttendanceChange(employee.employee_id, 'is_present', e.target.value === 'true')}
                      className={`border px-3 py-1 rounded ${
                        employee.is_present ? 'bg-green-100' : 'bg-red-100'
                      }`}
                    >
                      <option value="true">Present</option>
                      <option value="false">Absent</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <input
                      type="text"
                      value={employee.remarks || ''}
                      onChange={(e) => handleAttendanceChange(employee.employee_id, 'remarks', e.target.value)}
                      className="border px-2 py-1 rounded w-full"
                      placeholder="Remarks..."
                    />
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

export default withRoleGuard(AttendanceManagement, "admin");

