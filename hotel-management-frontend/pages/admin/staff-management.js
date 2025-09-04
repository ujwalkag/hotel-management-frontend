
// pages/admin/staff-management.js - Complete Staff Management System  
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import withRoleGuard from '@/hoc/withRoleGuard';
import toast from 'react-hot-toast';

function StaffManagement() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [staff, setStaff] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStaff();
    fetchAttendance();
  }, [currentMonth, currentYear]);

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/staff/profiles/', {
        headers: { Authorization: `Bearer ${user.access}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStaff(Array.isArray(data) ? data : data.results || []);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to load staff data');
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await fetch(`/api/staff/attendance/?month=${currentMonth}&year=${currentYear}`, {
        headers: { Authorization: `Bearer ${user.access}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAttendanceRecords(Array.isArray(data) ? data : data.results || []);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const markAttendance = async (staffId, status) => {
    setLoading(true);
    try {
      const response = await fetch('/api/staff/attendance/mark_attendance/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access}`
        },
        body: JSON.stringify({
          staff_id: staffId,
          status: status,
          date: new Date().toISOString().split('T')[0]
        })
      });

      if (response.ok) {
        fetchAttendance();
        toast.success(`Attendance marked as ${status} successfully!`);
      } else {
        const error = await response.json();
        toast.error('Failed to mark attendance: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceStatus = (staffId) => {
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendanceRecords.find(
      record => record.staff === staffId && record.date === today
    );
    return todayAttendance ? todayAttendance.status : 'not_marked';
  };

  const getMonthlyStats = (staffId) => {
    const staffAttendance = attendanceRecords.filter(record => record.staff === staffId);
    const present = staffAttendance.filter(record => record.status === 'present').length;
    const absent = staffAttendance.filter(record => record.status === 'absent').length;
    const totalHours = staffAttendance.reduce((sum, record) => sum + (record.total_hours || 8), 0);
    const overtimeHours = staffAttendance.reduce((sum, record) => sum + (record.overtime_hours || 0), 0);

    return { present, absent, totalHours, overtimeHours };
  };

  const tabs = [
    { id: 'overview', label: language === 'hi' ? 'अवलोकन' : 'Overview' },
    { id: 'attendance', label: language === 'hi' ? 'उपस्थिति' : 'Attendance' },
    { id: 'payroll', label: language === 'hi' ? 'वेतन' : 'Payroll' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                👥 {language === 'hi' ? 'कर्मचारी प्रबंधन' : 'Staff Management'}
              </h1>
              <p className="text-gray-600">
                {language === 'hi' 
                  ? 'उपस्थिति, वेतन, और कर्मचारी जानकारी प्रबंधित करें'
                  : 'Manage attendance, payroll, and staff information'
                }
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(Number(e.target.value))}
                className="border rounded px-3 py-2"
              >
                {Array.from({length: 12}, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2024, i).toLocaleString(language === 'hi' ? 'hi-IN' : 'default', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(Number(e.target.value))}
                className="border rounded px-3 py-2"
              >
                {Array.from({length: 5}, (_, i) => (
                  <option key={2022 + i} value={2022 + i}>
                    {2022 + i}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staff.map(member => {
                const attendanceStatus = getAttendanceStatus(member.id);
                const monthlyStats = getMonthlyStats(member.id);

                return (
                  <div key={member.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-lg">{member.full_name || member.user?.email}</h3>
                        <p className="text-sm text-gray-600 capitalize">{member.department || member.user?.role}</p>
                        <p className="text-xs text-gray-500">ID: {member.employee_id || member.id}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        attendanceStatus === 'present' ? 'bg-green-100 text-green-800' :
                        attendanceStatus === 'absent' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {attendanceStatus === 'not_marked' 
                          ? (language === 'hi' ? 'अंकित नहीं' : 'Not Marked')
                          : attendanceStatus === 'present'
                          ? (language === 'hi' ? 'उपस्थित' : 'Present')
                          : (language === 'hi' ? 'अनुपस्थित' : 'Absent')
                        }
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>{language === 'hi' ? 'विभाग:' : 'Department:'}</span>
                        <span className="font-medium capitalize">{member.department || member.user?.role}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{language === 'hi' ? 'पद:' : 'Position:'}</span>
                        <span className="font-medium">{member.position || 'Staff'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{language === 'hi' ? 'उपस्थित दिन:' : 'Days Present:'}</span>
                        <span className="font-medium">{monthlyStats.present}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{language === 'hi' ? 'कुल घंटे:' : 'Total Hours:'}</span>
                        <span className="font-medium">{monthlyStats.totalHours.toFixed(1)}h</span>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-4 space-y-2">
                      {attendanceStatus === 'not_marked' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => markAttendance(member.id, 'present')}
                            disabled={loading}
                            className="flex-1 bg-green-500 text-white py-1 px-2 rounded text-xs hover:bg-green-600 disabled:opacity-50"
                          >
                            ✓ {language === 'hi' ? 'उपस्थित' : 'Present'}
                          </button>
                          <button
                            onClick={() => markAttendance(member.id, 'absent')}
                            disabled={loading}
                            className="flex-1 bg-red-500 text-white py-1 px-2 rounded text-xs hover:bg-red-600 disabled:opacity-50"
                          >
                            ✗ {language === 'hi' ? 'अनुपस्थित' : 'Absent'}
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => setSelectedStaff(member)}
                        className="w-full bg-blue-500 text-white py-1 px-2 rounded text-xs hover:bg-blue-600"
                      >
                        📊 {language === 'hi' ? 'विवरण देखें' : 'View Details'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left font-medium text-gray-900">
                      {language === 'hi' ? 'कर्मचारी' : 'Staff'}
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-gray-900">
                      {language === 'hi' ? 'आज की स्थिति' : 'Today Status'}
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-gray-900">
                      {language === 'hi' ? 'इस महीने' : 'This Month'}
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-gray-900">
                      {language === 'hi' ? 'कुल घंटे' : 'Total Hours'}
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-gray-900">
                      {language === 'hi' ? 'कार्य' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map(member => {
                    const attendanceStatus = getAttendanceStatus(member.id);
                    const monthlyStats = getMonthlyStats(member.id);

                    return (
                      <tr key={member.id} className="border-t">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium">{member.full_name || member.user?.email}</div>
                            <div className="text-sm text-gray-500">{member.employee_id || `ID: ${member.id}`}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            attendanceStatus === 'present' ? 'bg-green-100 text-green-800' :
                            attendanceStatus === 'absent' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {attendanceStatus === 'not_marked' 
                              ? (language === 'hi' ? 'अंकित नहीं' : 'Not Marked')
                              : attendanceStatus === 'present'
                              ? (language === 'hi' ? 'उपस्थित' : 'Present')
                              : (language === 'hi' ? 'अनुपस्थित' : 'Absent')
                            }
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <div>{language === 'hi' ? 'उपस्थित' : 'Present'}: {monthlyStats.present}</div>
                            <div>{language === 'hi' ? 'अनुपस्थित' : 'Absent'}: {monthlyStats.absent}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {monthlyStats.totalHours.toFixed(1)}h
                        </td>
                        <td className="px-4 py-3">
                          {attendanceStatus === 'not_marked' && (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => markAttendance(member.id, 'present')}
                                disabled={loading}
                                className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 disabled:opacity-50"
                              >
                                {language === 'hi' ? 'उपस्थित' : 'Present'}
                              </button>
                              <button
                                onClick={() => markAttendance(member.id, 'absent')}
                                disabled={loading}
                                className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 disabled:opacity-50"
                              >
                                {language === 'hi' ? 'अनुपस्थित' : 'Absent'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payroll Tab */}
        {activeTab === 'payroll' && (
          <div className="p-6">
            <div className="space-y-4">
              {staff.map(member => {
                const monthlyStats = getMonthlyStats(member.id);
                const baseSalary = parseFloat(member.base_salary || 0);
                const overtimeAmount = monthlyStats.overtimeHours * parseFloat(member.hourly_rate || 0) * 1.5;
                const grossSalary = baseSalary + overtimeAmount;

                return (
                  <div key={member.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{member.full_name || member.user?.email}</h3>
                        <p className="text-sm text-gray-600">{member.employee_id || `ID: ${member.id}`} - {member.position || member.user?.role}</p>
                      </div>
                      <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                        {language === 'hi' ? 'वेतन जनरेट करें' : 'Generate Payroll'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="bg-gray-50 rounded p-3">
                        <div className="text-sm text-gray-600">{language === 'hi' ? 'मूल वेतन' : 'Base Salary'}</div>
                        <div className="font-bold text-lg">₹{baseSalary.toFixed(2)}</div>
                      </div>
                      <div className="bg-orange-50 rounded p-3">
                        <div className="text-sm text-gray-600">{language === 'hi' ? 'ओवरटाइम' : 'Overtime'}</div>
                        <div className="font-bold text-lg text-orange-600">₹{overtimeAmount.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">{monthlyStats.overtimeHours.toFixed(1)}h</div>
                      </div>
                      <div className="bg-green-50 rounded p-3">
                        <div className="text-sm text-gray-600">{language === 'hi' ? 'कुल वेतन' : 'Gross Salary'}</div>
                        <div className="font-bold text-lg text-green-600">₹{grossSalary.toFixed(2)}</div>
                      </div>
                      <div className="bg-blue-50 rounded p-3">
                        <div className="text-sm text-gray-600">{language === 'hi' ? 'उपस्थित दिन' : 'Days Present'}</div>
                        <div className="font-bold text-lg text-blue-600">{monthlyStats.present}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Staff Detail Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {selectedStaff.full_name || selectedStaff.user?.email} - {language === 'hi' ? 'विवरण' : 'Details'}
              </h2>
              <button
                onClick={() => setSelectedStaff(null)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {language === 'hi' ? 'पूरा नाम' : 'Full Name'}
                  </label>
                  <div className="mt-1 text-sm">{selectedStaff.full_name || selectedStaff.user?.email}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {language === 'hi' ? 'विभाग' : 'Department'}
                  </label>
                  <div className="mt-1 text-sm capitalize">{selectedStaff.department || selectedStaff.user?.role}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {language === 'hi' ? 'पद' : 'Position'}
                  </label>
                  <div className="mt-1 text-sm">{selectedStaff.position || 'Staff'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {language === 'hi' ? 'स्थिति' : 'Status'}
                  </label>
                  <div className="mt-1 text-sm">
                    {selectedStaff.employment_status || selectedStaff.user?.is_active 
                      ? (language === 'hi' ? 'सक्रिय' : 'Active')
                      : (language === 'hi' ? 'निष्क्रिय' : 'Inactive')
                    }
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {language === 'hi' ? 'फोन' : 'Phone'}
                  </label>
                  <div className="mt-1 text-sm">{selectedStaff.phone || 'N/A'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {language === 'hi' ? 'कर्मचारी ID' : 'Employee ID'}
                  </label>
                  <div className="mt-1 text-sm">{selectedStaff.employee_id || selectedStaff.id}</div>
                </div>
              </div>

              {/* Monthly Performance placeholder */}
              <div className="bg-gray-50 rounded p-4">
                <h3 className="font-medium mb-2">
                  {language === 'hi' ? 'मासिक प्रदर्शन' : 'Monthly Performance'}
                </h3>
                <div className="text-sm text-gray-600">
                  {language === 'hi' 
                    ? 'उपस्थिति चार्ट और प्रदर्शन मेट्रिक्स यहाँ प्रदर्शित होंगे'
                    : 'Attendance chart and performance metrics would be displayed here'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withRoleGuard(StaffManagement, ['admin']);

