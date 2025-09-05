import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import withRoleGuard from '@/hoc/withRoleGuard';
import toast from 'react-hot-toast';

function PayrollStaffManagement() {
  const { user } = useAuth();
  const [payrollStaff, setPayrollStaff] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  
  // Modals
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [payrollData, setPayrollData] = useState(null);

  // Forms
  const [staffForm, setStaffForm] = useState({
    full_name: '',
    phone: '',
    department: 'service',
    position: '',
    base_salary: '',
    hourly_rate: ''
  });

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
      await Promise.all([fetchPayrollStaff(), fetchAttendance()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayrollStaff = async () => {
    try {
      const response = await fetch('/api/staff/payroll-staff/', {
        headers: { Authorization: `Bearer ${user.access}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPayrollStaff(Array.isArray(data) ? data : data.results || []);
      }
    } catch (error) {
      console.error('Error fetching payroll staff:', error);
      toast.error('Failed to load payroll staff data');
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

  const createPayrollStaff = async () => {
    if (!staffForm.full_name || !staffForm.phone) {
      toast.error('Name and phone are required');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/staff/payroll-staff/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access}`
        },
        body: JSON.stringify(staffForm)
      });

      if (response.ok) {
        toast.success('Payroll staff created successfully');
        setShowStaffModal(false);
        setStaffForm({
          full_name: '', phone: '', department: 'service', position: '',
          base_salary: '', hourly_rate: ''
        });
        fetchPayrollStaff();
      } else {
        const error = await response.json();
        toast.error('Failed to create staff: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating staff:', error);
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async () => {
    if (!attendanceForm.staff_id || !attendanceForm.date) {
      toast.error('Staff and date are required');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/staff/attendance/mark/', {
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

  const deletePayrollStaff = async (staffId) => {
    if (!confirm('Are you sure you want to delete this payroll staff member?')) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/staff/payroll-staff/${staffId}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.access}` }
      });

      if (response.ok) {
        toast.success('Payroll staff deleted successfully');
        fetchPayrollStaff();
      } else {
        const error = await response.json();
        toast.error('Failed to delete staff: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
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
                <h1 className="text-2xl font-bold">💰 Payroll & Attendance Management</h1>
                <p className="text-gray-600">Manage separate payroll staff, attendance, and salary calculations</p>
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

          {/* Action Buttons */}
          <div className="p-6 border-b bg-gray-50">
            <div className="flex gap-3">
              <button
                onClick={() => setShowStaffModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                disabled={loading}
              >
                👤 Add Payroll Staff
              </button>
              
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
                {payrollStaff.length > 0 ? (
                  payrollStaff.map(member => {
                    const monthlyStats = getMonthlyStats(member.id);
                    
                    return (
                      <div key={member.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">{member.full_name}</h3>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {member.employee_id || 'No ID'}
                              </span>
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                Payroll Staff
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Department:</span>
                                <p className="font-medium">{member.department}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Position:</span>
                                <p className="font-medium">{member.position}</p>
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
                                <span className="text-gray-500">Total Hours:</span>
                                <p className="font-medium">{monthlyStats.totalHours.toFixed(1)}h</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Phone:</span>
                                <p className="font-medium">{member.phone}</p>
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
                            
                            <button
                              onClick={() => deletePayrollStaff(member.id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm"
                              disabled={loading}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">💰</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No payroll staff found</h3>
                    <p className="text-gray-500">Add your first payroll staff member to manage attendance and salaries</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Payroll Staff Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">👤 Add Payroll Staff</h2>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Full Name *"
                value={staffForm.full_name}
                onChange={(e) => setStaffForm({...staffForm, full_name: e.target.value})}
                className="w-full border rounded px-3 py-2"
              />
              
              <input
                type="tel"
                placeholder="Phone Number *"
                value={staffForm.phone}
                onChange={(e) => setStaffForm({...staffForm, phone: e.target.value})}
                className="w-full border rounded px-3 py-2"
              />
              
              <select
                value={staffForm.department}
                onChange={(e) => setStaffForm({...staffForm, department: e.target.value})}
                className="w-full border rounded px-3 py-2"
              >
                <option value="kitchen">Kitchen</option>
                <option value="service">Service</option>
                <option value="housekeeping">Housekeeping</option>
                <option value="management">Management</option>
                <option value="billing">Billing</option>
              </select>
              
              <input
                type="text"
                placeholder="Position"
                value={staffForm.position}
                onChange={(e) => setStaffForm({...staffForm, position: e.target.value})}
                className="w-full border rounded px-3 py-2"
              />
              
              <input
                type="number"
                placeholder="Base Salary (₹)"
                value={staffForm.base_salary}
                onChange={(e) => setStaffForm({...staffForm, base_salary: e.target.value})}
                className="w-full border rounded px-3 py-2"
              />
              
              <input
                type="number"
                placeholder="Hourly Rate (₹)"
                value={staffForm.hourly_rate}
                onChange={(e) => setStaffForm({...staffForm, hourly_rate: e.target.value})}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={createPayrollStaff}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Staff'}
              </button>
              
              <button
                onClick={() => setShowStaffModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
                <option value="">Select Payroll Staff</option>
                {payrollStaff.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.full_name} ({member.phone})
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

export default withRoleGuard(PayrollStaffManagement, ['admin', 'staff']);
