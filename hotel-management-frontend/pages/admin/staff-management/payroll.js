import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import withRoleGuard from "@/hoc/withRoleGuard";
import Link from "next/link";

function PayrollReport() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [payrollData, setPayrollData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState('current_month');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    useEffect(() => {
        if (user?.access) {
            fetchPayrollData();
        }
    }, [user, dateFilter, selectedMonth, selectedYear, customStartDate, customEndDate]);

    const fetchPayrollData = async () => {
        try {
            setLoading(true);

            // Build query parameters based on selected filter
            let queryParams = '';

            if (dateFilter === 'custom' && customStartDate && customEndDate) {
                queryParams = `?start_date=${customStartDate}&end_date=${customEndDate}`;
            } else if (dateFilter === 'specific_month') {
                queryParams = `?year=${selectedYear}&month=${selectedMonth}`;
            } else {
                // Current month (default)
                const now = new Date();
                queryParams = `?year=${now.getFullYear()}&month=${now.getMonth() + 1}`;
            }

            const res = await fetch(`/api/staff-management/payroll-summary/${queryParams}`, {
                headers: { Authorization: `Bearer ${user.access}` },
            });

            if (res.ok) {
                const data = await res.json();
                setPayrollData(data);
            } else {
                throw new Error('Failed to fetch payroll data');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error("Failed to load payroll data");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return `₹${amount?.toLocaleString('en-IN') || '0'}`;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-lg">Loading payroll report...</div>
            </div>
        );
    }

    if (!payrollData) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-900">No payroll data available</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">
                    💰 Payroll Report / वेतन रिपोर्ट
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

            {/* Date Filter Controls */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Reporting Period</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        >
                            <option value="current_month">Current Month</option>
                            <option value="specific_month">Specific Month</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>

                    {dateFilter === 'specific_month' && (
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

                    {dateFilter === 'custom' && (
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

                {payrollData.period_summary && (
                    <div className="mt-4 text-sm text-gray-600">
                        <strong>Selected Period:</strong> 
                        {payrollData.period_summary.start_date && payrollData.period_summary.end_date ? (
                            ` ${new Date(payrollData.period_summary.start_date).toLocaleDateString('en-IN')} to ${new Date(payrollData.period_summary.end_date).toLocaleDateString('en-IN')}`
                        ) : payrollData.period_summary.month && payrollData.period_summary.year ? (
                            ` ${payrollData.period_summary.month}/${payrollData.period_summary.year}`
                        ) : ' Current Month'}
                    </div>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-bold">👥</span>
                            </div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Employees</p>
                            <p className="text-2xl font-bold text-blue-600">{payrollData.total_employees}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-green-600 font-bold">💰</span>
                            </div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Period Total</p>
                            <p className="text-2xl font-bold text-green-600">
                                {formatCurrency(payrollData.total_paid.custom_period)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <span className="text-purple-600 font-bold">📅</span>
                            </div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Current Month</p>
                            <p className="text-2xl font-bold text-purple-600">
                                {formatCurrency(payrollData.total_paid.current_month_attendance)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                <span className="text-orange-600 font-bold">📊</span>
                            </div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Till Date Total</p>
                            <p className="text-2xl font-bold text-orange-600">
                                {formatCurrency(payrollData.total_paid.till_date)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Designation-wise Breakdown */}
            <div className="bg-white rounded-lg shadow mb-6">
                <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">
                        Designation-wise Payroll Summary
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
                                    Monthly Salary
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Period Total
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Till Date Total
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {payrollData.designations.map((designation) => (
                                <tr key={designation.name} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {designation.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {designation.employee_count}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatCurrency(designation.designation_daily_wage)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatCurrency(designation.designation_monthly_salary)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                        {formatCurrency(designation.period_total)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-600">
                                        {formatCurrency(designation.till_date_total)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                    Total
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                    {payrollData.total_employees}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    -
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    -
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                                    {formatCurrency(payrollData.total_paid.custom_period)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-purple-600">
                                    {formatCurrency(payrollData.total_paid.till_date)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
                <Link 
                    href="/admin/staff-management/employees"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
                >
                    👤 Manage Employees
                </Link>
                <Link 
                    href="/admin/staff-management/attendance"
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium"
                >
                    📅 Mark Attendance
                </Link>
                <button 
                    onClick={() => window.print()}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-medium"
                >
                    🖨️ Print Report
                </button>
            </div>

            {/* Help Information */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Payroll Calculation Info:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• <strong>Period Total:</strong> Payment for the selected time period based on attendance with payment inclusion</li>
                    <li>• <strong>Current Month:</strong> Payment for current month based on attendance records</li>
                    <li>• <strong>Till Date Total:</strong> Total payments made via recorded monthly payments or calculated from attendance</li>
                    <li>• <strong>Payment Control:</strong> Only days with "Include Payment" checkbox are counted for salary calculation</li>
                </ul>
            </div>
        </div>
    );
}

export default withRoleGuard(PayrollReport, "admin");
