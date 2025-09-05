import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import withRoleGuard from '@/hoc/withRoleGuard';
import toast from 'react-hot-toast';

function StaffPayrollManagement() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [staff, setStaff] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [payrollData, setPayrollData] = useState(null);

  // Modals - NO STAFF CREATION MODAL, ONLY ATTENDANCE
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({
    staff_id: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    check_in_time: '',
    check_out_time: '',
    notes: ''
  });

  useEffect(() => {
    fetchAllData();
  }, [currentMonth, currentYear, user]);

  const fetchAllData = async () => {
    if (!user?.access) return;

    try {
      setLoading(true);
      await Promise.all([
        fetchStaff(),
        fetchAttendance()
      ]);
    } finally {
      setLoading(false);
    }
  };

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

  const markAttendance = async () => {
    if (!attendanceForm.staff_id || !attendanceForm.date) {
      toast.error('Staff and date are required');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/staff/attendance/mark_attendance/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access}`
        },
        body: JSON.stringify(attendanceForm)
      });

      if (response.ok) {
        toast.success('Attendance marked successfully');
        setShowAttendanceModal(false);
        setAttendanceForm({
          staff_id: '', date: new Date().toISOString().split('T')[0],
          status: 'present', check_in_time: '', check_out_time: '', notes: ''
        });
        fetchAttendance();
      } else {
        const error = await response.json();
        toast.error('Failed to mark attendance: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const generatePayroll = async (staffId) => {
    try {
      setLoading(true);
      const response = await fetch('/api/staff/generate_payroll/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access}`
        },
        body: JSON.stringify({
          staff_id: staffId,
          month: currentMonth,
          year: currentYear
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPayrollData(data.payroll);
        setShowPayrollModal(true);
        toast.success(`Payroll generated for ${data.payroll.staff_name}`);
      } else {
        const error = await response.json();
        toast.error('Failed to generate payroll: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error generating payroll:', error);
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const getMonthlyStats = (staffId) => {
    const staffAttendance = attendanceRecords.filter(record => record.staff === staffId);
    const present = staffAttendance.filter(record => record.status === 'present').length;
    const absent = staffAttendance.filter(record => record.status === 'absent').length;
    const totalHours = staffAttendance.reduce((sum, record) => sum + (parseFloat(record.total_hours) || 0), 0);
    const overtimeHours = staffAttendance.reduce((sum, record) => sum + (parseFloat(record.overtime_hours) || 0), 0);

    return { present, absent, totalHours, overtimeHours };
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold">💰 Staff Payroll & Attendance</h1>
                <p className="text-gray-600">Track attendance and generate payroll (Staff creation in Role Management)</p>
              </div>
              
              <div className="flex gap-2">
                <select
                  value={currentMonth}
                  onChange={(e) => setCurrentMonth(Number(e.target.value))}
                  className="border rounded px-3 py-2"
                >
                  {Array.from({length: 12}, (_, i) => (
                    <option key={i+1} value={i+1}>
                      {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
                
                <select
                  value={currentYear}
                  onChange={(e) => setCurrentYear(Number(e.target.value))}
                  className="border rounded px-3 py-2"
                >
                  {Array.from({length: 5}, (_, i) => (
                    <option key={2022+i} value={2022+i}>{2022+i}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons - ONLY ATTENDANCE, NO STAFF CREATION */}
          <div className="p-6 border-b bg-gray-50">
            <div className="flex gap-3">
              <button
                onClick={() => setShowAttendanceModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                disabled={loading}
              >
                📝 Mark Attendance
              </button>
              
              <button
                onClick={() => fetchAllData()}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                disabled={loading}
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {/* Staff List */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid gap-4">
                {staff.length > 0 ? (
                  staff.map(member => {
                    const monthlyStats = getMonthlyStats(member.id);
                    
                    return (
                      <div key={member.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">{member.full_name}</h3>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {member.employee_id}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                member.employment_status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {member.employment_status}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Department:</span>
                                <p className="font-medium">{member.department}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Base Salary:</span>
                                <p className="font-medium">₹{member.base_salary}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Present Days:</span>
                                <p className="font-medium text-green-600">{monthlyStats.present}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Absent Days:</span>
                                <p className="font-medium text-red-600">{monthlyStats.absent}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Total Hours:</span>
                                <p className="font-medium">{monthlyStats.totalHours.toFixed(1)}h</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Overtime:</span>
                                <p className="font-medium text-orange-600">{monthlyStats.overtimeHours.toFixed(1)}h</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => generatePayroll(member.id)}
                              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm"
                              disabled={loading}
                            >
                              💰 Generate Payroll
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No staff members found. Create staff in Role Management first.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mark Attendance Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">📝 Mark Attendance</h2>
            
            <div className="space-y-4">
              <select
                value={attendanceForm.staff_id}
                onChange={(e) => setAttendanceForm({...attendanceForm, staff_id: e.target.value})}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select Staff Member</option>
                {staff.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.full_name} ({member.employee_id})
                  </option>
                ))}
              </select>
              
              <input
                type="date"
                value={attendanceForm.date}
                onChange={(e) => setAttendanceForm({...attendanceForm, date: e.target.value})}
                className="w-full border rounded px-3 py-2"
              />
              
              <select
                value={attendanceForm.status}
                onChange={(e) => setAttendanceForm({...attendanceForm, status: e.target.value})}
                className="w-full border rounded px-3 py-2"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="half_day">Half Day</option>
                <option value="late">Late</option>
                <option value="on_leave">On Leave</option>
              </select>
              
              <input
                type="time"
                placeholder="Check In Time"
                value={attendanceForm.check_in_time}
                onChange={(e) => setAttendanceForm({...attendanceForm, check_in_time: e.target.value})}
                className="w-full border rounded px-3 py-2"
              />
              
              <input
                type="time"
                placeholder="Check Out Time"
                value={attendanceForm.check_out_time}
                onChange={(e) => setAttendanceForm({...attendanceForm, check_out_time: e.target.value})}
                className="w-full border rounded px-3 py-2"
              />
              
              <textarea
                placeholder="Notes (optional)"
                value={attendanceForm.notes}
                onChange={(e) => setAttendanceForm({...attendanceForm, notes: e.target.value})}
                className="w-full border rounded px-3 py-2"
                rows="3"
              />
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={markAttendance}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Marking...' : 'Mark Attendance'}
              </button>
              
              <button
                onClick={() => setShowAttendanceModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Display Modal */}
      {showPayrollModal && payrollData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">💰 Payroll Summary</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Staff:</span>
                <span className="font-medium">{payrollData.staff_name}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Month/Year:</span>
                <span className="font-medium">{payrollData.month}/{payrollData.year}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Present Days:</span>
                <span className="font-medium text-green-600">{payrollData.total_days_present}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Total Hours:</span>
                <span className="font-medium">{payrollData.total_hours}h</span>
              </div>
              
              <div className="flex justify-between">
                <span>Overtime Hours:</span>
                <span className="font-medium text-orange-600">{payrollData.overtime_hours}h</span>
              </div>
              
              <hr className="my-4" />
              
              <div className="flex justify-between">
                <span>Base Salary:</span>
                <span className="font-medium">₹{payrollData.base_salary}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Overtime Amount:</span>
                <span className="font-medium">₹{payrollData.overtime_amount}</span>
              </div>
              
              <hr className="my-4" />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Gross Salary:</span>
                <span className="text-green-600">₹{payrollData.gross_salary}</span>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPayrollModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withRoleGuard(StaffPayrollManagement, ['admin', 'staff']);

