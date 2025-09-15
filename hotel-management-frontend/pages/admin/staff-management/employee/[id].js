import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import withRoleGuard from "@/hoc/withRoleGuard";
import Link from "next/link";

function EmployeeDetail() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const { id } = router.query;
    const [employeeData, setEmployeeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('current_month');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        if (id && user?.access) {
            fetchEmployeeDetails();
        }
    }, [id, user, dateRange, customStartDate, customEndDate, selectedMonth, selectedYear]);

    const fetchEmployeeDetails = async () => {
        try {
            setLoading(true);

            // Build query parameters based on selected range
            let queryParams = '';

            if (dateRange === 'custom' && customStartDate && customEndDate) {
                queryParams = `?start_date=${customStartDate}&end_date=${customEndDate}`;
            } else if (dateRange === 'specific_month') {
                queryParams = `?year=${selectedYear}&month=${selectedMonth}`;
            } else {
                // Current month (default)
                const now = new Date();
                queryParams = `?year=${now.getFullYear()}&month=${now.getMonth() + 1}`;
            }

            const res = await fetch(`/api/staff-management/employees/${id}/detail_stats/${queryParams}`, {
                headers: { Authorization: `Bearer ${user.access}` },
            });

            if (res.ok) {
                const data = await res.json();
                setEmployeeData(data);
            } else {
                throw new Error('Failed to fetch employee details');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error("Failed to load employee details");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return `₹${amount?.toLocaleString('en-IN') || '0'}`;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN');
    };

    const getPaymentStatusBadge = (record) => {
        if (record.include_payment) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Paid
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Unpaid
                </span>
            );
        }
    };

    const getAttendanceStatusBadge = (isPresent) => {
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isPresent 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-800'
            }`}>
                {isPresent ? 'Present' : 'Absent'}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-lg">Loading employee details...</div>
            </div>
        );
    }

    if (!employeeData) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-900">Employee not found</h2>
                    <Link href="/admin/staff-management/employees" className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded">
                        ← Back to Employees
                    </Link>
                </div>
            </div>
        );
    }

    const { employee, period, attendance_summary, monthly_stats, attendance_records, recent_payments } = employeeData;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">
                    👤 Employee Details: {employee.name}
                </h1>

                <div className="mt-4 flex space-x-4">
                    <Link href="/admin/staff-management/employees" className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                        ← Back to Employees
                    </Link>
                    <Link href="/admin/dashboard" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                        🏠 Home
                    </Link>
                </div>
            </div>

            {/* Employee Information Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Full Name</label>
                            <p className="mt-1 text-sm text-gray-900">{employee.name}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Phone</label>
                            <p className="mt-1 text-sm text-gray-900">{employee.phone || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Aadhar Number</label>
                            <p className="mt-1 text-sm text-gray-900">{employee.aadhar_number || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Designation</label>
                            <p className="mt-1 text-sm text-gray-900">{employee.designation_name}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Date of Joining</label>
                            <p className="mt-1 text-sm text-gray-900">{formatDate(employee.date_of_joining)}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Status</label>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                employee.is_active 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                            }`}>
                                {employee.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-500">Address</label>
                            <p className="mt-1 text-sm text-gray-900">{employee.address}</p>
                        </div>
                    </div>
                </div>

                {/* Salary Information */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Salary Information</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Monthly Salary</label>
                            <p className="mt-1 text-xl font-bold text-green-600">{formatCurrency(employee.monthly_salary)}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Daily Wage</label>
                            <p className="mt-1 text-lg font-semibold text-blue-600">{formatCurrency(employee.daily_wage)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Date Range Selector */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Time Period</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        >
                            <option value="current_month">Current Month</option>
                            <option value="specific_month">Specific Month</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>

                    {dateRange === 'specific_month' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                    className="w-full border rounded px-3 py-2"
                                >
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                            {new Date(2023, i, 1).toLocaleString('en-IN', { month: 'long' })}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="w-full border rounded px-3 py-2"
                                >
                                    {Array.from({ length: 5 }, (_, i) => {
                                        const year = new Date().getFullYear() - 2 + i;
                                        return (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </>
                    )}

                    {dateRange === 'custom' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                                <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                                <input
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                        </>
                    )}
                </div>

                <div className="mt-4 text-sm text-gray-600">
                    <strong>Selected Period:</strong> {formatDate(period.start_date)} to {formatDate(period.end_date)} 
                    ({period.total_days} days)
                </div>
            </div>

            {/* Attendance Summary for Selected Period */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-bold">✓</span>
                            </div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Present Days</p>
                            <p className="text-2xl font-bold text-blue-600">{attendance_summary.total_present}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                <span className="text-red-600 font-bold">✗</span>
                            </div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Absent Days</p>
                            <p className="text-2xl font-bold text-red-600">{attendance_summary.total_absent}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-green-600 font-bold">₹</span>
                            </div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Paid Days</p>
                            <p className="text-2xl font-bold text-green-600">{attendance_summary.total_paid_days}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <span className="text-purple-600 font-bold">💰</span>
                            </div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Pay</p>
                            <p className="text-2xl font-bold text-purple-600">{formatCurrency(attendance_summary.total_pay)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Monthly & Yearly Statistics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Current Month ({monthly_stats.current_month.month}/{monthly_stats.current_month.year})
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                            <p className="text-sm text-gray-500">Present</p>
                            <p className="text-xl font-bold text-blue-600">{monthly_stats.current_month.present_days}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-500">Absent</p>
                            <p className="text-xl font-bold text-red-600">{monthly_stats.current_month.absent_days}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-500">Paid Days</p>
                            <p className="text-xl font-bold text-green-600">{monthly_stats.current_month.paid_days}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-500">Total Pay</p>
                            <p className="text-xl font-bold text-purple-600">{formatCurrency(monthly_stats.current_month.total_pay)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Year {monthly_stats.current_year.year} (Till Date)
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                            <p className="text-sm text-gray-500">Present</p>
                            <p className="text-xl font-bold text-blue-600">{monthly_stats.current_year.total_present}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-500">Absent</p>
                            <p className="text-xl font-bold text-red-600">{monthly_stats.current_year.total_absent}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-500">Paid Days</p>
                            <p className="text-xl font-bold text-green-600">{monthly_stats.current_year.total_paid_days}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-500">Total Pay</p>
                            <p className="text-xl font-bold text-purple-600">{formatCurrency(monthly_stats.current_year.total_pay)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Attendance Records */}
            <div className="bg-white rounded-lg shadow mb-6">
                <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">
                        Attendance Records ({attendance_records.length} records)
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Attendance
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Payment Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Payment Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Remarks
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {attendance_records.map((record) => (
                                <tr key={record.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatDate(record.date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getAttendanceStatusBadge(record.is_present)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getPaymentStatusBadge(record)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {formatCurrency(record.payment_amount)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {record.remarks || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Payment History */}
            {recent_payments && recent_payments.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b">
                        <h3 className="text-lg font-semibold text-gray-800">Recent Payment History</h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Period
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Present Days
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Paid Days
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total Paid
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Payment Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {recent_payments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {payment.month}/{payment.year}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {payment.present_days}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {payment.paid_days}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {formatCurrency(payment.total_paid)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(payment.payment_date)}
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

export default withRoleGuard(EmployeeDetail, "admin");
