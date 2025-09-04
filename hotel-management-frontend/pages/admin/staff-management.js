import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import withRoleGuard from '@/hoc/withRoleGuard';
import toast from 'react-hot-toast';

function CompleteStaffManagement() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [staff, setStaff] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  // Modals
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);

  // Forms
  const [staffForm, setStaffForm] = useState({
    full_name: '',
    phone: '',
    department: 'service',
    position: '',
    base_salary: '',
    hourly_rate: '',
    user_email: '',
    user_password: '',
    user_role: 'staff'
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

  const createStaffProfile = async () => {
    if (!staffForm.full_name || !staffForm.user_email) {
      toast.error('Name and email are required');
      return;
    }

    try {
      setLoading(true);
      
      // First create user account
      const userResponse = await fetch('/api/users/staff/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access}`
        },
        body: JSON.stringify({
          email: staffForm.user_email,
          password: staffForm.user_password || 'default123',
          role: staffForm.user_role
        })
      });

      if (!userResponse.ok) {
        const error = await userResponse.json();
        toast.error('Failed to create user: ' + (error.error || 'Unknown error'));
        return;
      }

      const userData = await userResponse.json();

      // Then create staff profile
      const profileResponse = await fetch('/api/staff/profiles/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access}`
        },
        body: JSON.stringify({
          user: userData.user.id,
          full_name: staffForm.full_name,
          phone: staffForm.phone,
          department: staffForm.department,
          position: staffForm.position,
          base_salary: parseFloat(staffForm.base_salary) || 0,
          hourly_rate: parseFloat(staffForm.hourly_rate) || 0
        })
      });

      if (profileResponse.ok) {
        toast.success('Staff profile created successfully');
        setShowStaffModal(false);
        setStaffForm({
          full_name: '', phone: '', department: 'service', position: '',
          base_salary: '', hourly_rate: '', user_email: '', user_password: '', user_role: 'staff'
        });
        fetchStaff();
      } else {
        const error = await profileResponse.json();
        toast.error('Failed to create profile: ' + (error.error || 'Unknown error'));
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
        toast.success(`Payroll generated for ${data.payroll.staff_name}`);
        console.log('Payroll data:', data.payroll);
        // You can display the payroll data in a modal or download it
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

  const deleteStaff = async (staffId) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/staff/profiles/${staffId}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.access}` }
      });

      if (response.ok) {
        toast.success('Staff member deleted successfully');
        fetchStaff();
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
                <h1 className="text-2xl font-bold">👥 Complete Staff Management</h1>
                <p className="text-gray-600">Manage staff profiles, attendance, and payroll</p>
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
                ➕ Add Staff
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
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Department:</span>
                                <p className="font-medium">{member.department}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Position:</span>
                                <p className="font-medium">{member.position}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Present Days:</span>
                                <p className="font-medium text-green-600">{monthlyStats.present}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Total Hours:</span>
                                <p className="font-medium">{monthlyStats.totalHours.toFixed(1)}h</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => generatePayroll(member.id)}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                              disabled={loading}
                            >
                              💰 Payroll
                            </button>
                            
                            <button
                              onClick={() => deleteStaff(member.id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
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
                    <p className="text-gray-500">No staff members found. Add your first staff member.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New Staff</h2>
            
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
                placeholder="Phone Number"
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
                placeholder="Base Salary"
                value={staffForm.base_salary}
                onChange={(e) => setStaffForm({...staffForm, base_salary: e.target.value})}
                className="w-full border rounded px-3 py-2"
              />
              
              <input
                type="number"
                placeholder="Hourly Rate"
                value={staffForm.hourly_rate}
                onChange={(e) => setStaffForm({...staffForm, hourly_rate: e.target.value})}
                className="w-full border rounded px-3 py-2"
              />
              
              
              <select
                value={staffForm.user_role}
                onChange={(e) => setStaffForm({...staffForm, user_role: e.target.value})}
                className="w-full border rounded px-3 py-2"
              >
                <option value="staff">Staff</option>
                <option value="waiter">Waiter</option>
                <option value="biller">Biller</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={createStaffProfile}
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
            <h2 className="text-xl font-bold mb-4">Mark Attendance</h2>
            
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
    </div>
  );
}

export default withRoleGuard(CompleteStaffManagement, ['admin', 'staff']);
