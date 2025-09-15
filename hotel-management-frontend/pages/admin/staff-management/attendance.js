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
            prev.map(emp => {
                if (emp.employee_id === employeeId) {
                    const updatedEmp = { ...emp, [field]: value };

                    // Auto-update include_payment when changing attendance
                    if (field === 'is_present') {
                        updatedEmp.include_payment = value; // Default to match presence
                    }

                    return updatedEmp;
                } else {
                    return emp;
                }
            })
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
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-lg">Loading attendance...</div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">
                    📅 Daily Attendance / दैनिक उपस्थिति
                </h1>

                <div className="mt-4 flex space-x-4">
                    <Link href="/admin/staff-management" className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                        ← Back
                    </Link>
                    <Link href="/admin/dashboard" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                        🏠 Home
                    </Link>
                </div>
            </div>

            {/* Date Selector */}
            <div className="mb-6 bg-white p-4 rounded-lg shadow">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date:
                </label>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="border px-3 py-2 rounded"
                />
                <span className="ml-4 text-sm text-gray-600">
                    Total Employees: {attendanceData.length}
                </span>
            </div>

            {/* Attendance Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">
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
                                    Attendance
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Payment Control
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Remarks
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {attendanceData.map((employee) => (
                                <tr key={employee.employee_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {employee.employee_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {employee.designation}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        ₹{employee.monthly_salary?.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        ₹{employee.daily_wage?.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <select
                                            value={employee.is_present ? 'true' : 'false'}
                                            onChange={(e) => handleAttendanceChange(employee.employee_id, 'is_present', e.target.value === 'true')}
                                            className={`border px-3 py-1 rounded ${
                                                employee.is_present ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'
                                            }`}
                                        >
                                            <option value="true">Present</option>
                                            <option value="false">Absent</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="space-y-2">
                                            <label className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={employee.include_payment}
                                                    onChange={(e) => handleAttendanceChange(employee.employee_id, 'include_payment', e.target.checked)}
                                                    className="rounded border-gray-300"
                                                />
                                                <span className="ml-2 text-xs">
                                                    Include Payment
                                                </span>
                                            </label>
                                            <div className="text-xs text-gray-400">
                                                Amount: ₹{employee.include_payment ? employee.daily_wage : 0}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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

                <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                        Total Present: {attendanceData.filter(emp => emp.is_present).length} |
                        Total with Payment: {attendanceData.filter(emp => emp.include_payment).length} |
                        Total Payment: ₹{attendanceData.filter(emp => emp.include_payment).reduce((sum, emp) => sum + (emp.daily_wage || 0), 0).toLocaleString('en-IN')}
                    </div>
                    <button
                        onClick={saveAttendance}
                        disabled={saving}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Attendance'}
                    </button>
                </div>
            </div>

            {/* Help Text */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Payment Control Guide:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• <strong>Present + Include Payment:</strong> Employee gets paid for the day</li>
                    <li>• <strong>Present + No Payment:</strong> Employee was present but no payment (unpaid leave, etc.)</li>
                    <li>• <strong>Absent + Include Payment:</strong> Employee gets paid despite absence (sick pay, etc.)</li>
                    <li>• <strong>Absent + No Payment:</strong> Employee was absent and gets no payment</li>
                </ul>
            </div>
        </div>
    );
}

export default withRoleGuard(AttendanceManagement, "admin");
