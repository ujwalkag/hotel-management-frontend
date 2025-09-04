// components/staff/StaffManagement.js - COMPLETE VERSION WITH ALL LATEST FEATURES
// Updated from your existing code with Add/Delete functionality and Role Management
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

const StaffManagement = () => {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  // NEW: Add Staff Modal State with Role Support
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffData, setNewStaffData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    department: 'service',
    position: '',
    base_salary: '',
    hourly_rate: '',
    role: 'staff',
    can_create_orders: true,
    can_generate_bills: true,
    can_access_kitchen: true
  });

  // NEW: Role Management Modal State
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingStaffRole, setEditingStaffRole] = useState(null);

  useEffect(() => {
    fetchStaff();
    fetchAttendance();
  }, [currentMonth, currentYear]);

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/staff/profiles/', {
        headers: { Authorization: `Bearer ${user.access}` }
      });
      const data = await response.json();
      setStaff(data.results || data);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await fetch(`/api/staff/attendance/?month=${currentMonth}&year=${currentYear}`, {
        headers: { Authorization: `Bearer ${user.access}` }
      });
      const data = await response.json();
      setAttendanceRecords(data.results || data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  // NEW: Handle Role Change with Auto-Permission Assignment
  const handleRoleChange = (role) => {
    let permissions = {
      can_create_orders: false,
      can_generate_bills: false,
      can_access_kitchen: false
    };

    switch(role) {
      case 'admin':
        permissions = {
          can_create_orders: true,
          can_generate_bills: true,
          can_access_kitchen: true
        };
        break;
      case 'waiter':
        permissions = {
          can_create_orders: true,
          can_generate_bills: false,
          can_access_kitchen: false
        };
        break;
      case 'staff':
        permissions = {
          can_create_orders: true,
          can_generate_bills: true,
          can_access_kitchen: true
        };
        break;
      case 'biller':
        permissions = {
          can_create_orders: false,
          can_generate_bills: true,
          can_access_kitchen: false
        };
        break;
    }

    setNewStaffData({
      ...newStaffData,
      role: role,
      ...permissions
    });
  };

  // UPDATED: Add Staff Function with Role Support
  const addNewStaff = async () => {
    if (!newStaffData.full_name || !newStaffData.email || !newStaffData.password) {
      alert('Please fill in all required fields (Name, Email, Password)');
      return;
    }

    setLoading(true);
    try {
      // Create user with role and permissions
      const userResponse = await fetch('/api/users/staff/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access}`
        },
        body: JSON.stringify({
          email: newStaffData.email,
          password: newStaffData.password,
          first_name: newStaffData.full_name.split(' ')[0],
          last_name: newStaffData.full_name.split(' ').slice(1).join(' '),
          role: newStaffData.role,
          can_create_orders: newStaffData.can_create_orders,
          can_generate_bills: newStaffData.can_generate_bills,
          can_access_kitchen: newStaffData.can_access_kitchen
        })
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        
        // Create staff profile
        const staffResponse = await fetch('/api/staff/profiles/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.access}`
          },
          body: JSON.stringify({
            user: userData.user.id,
            full_name: newStaffData.full_name,
            phone: newStaffData.phone,
            department: newStaffData.department,
            position: newStaffData.position,
            base_salary: newStaffData.base_salary || 0,
            hourly_rate: newStaffData.hourly_rate || 0,
            employment_status: 'active'
          })
        });

        if (staffResponse.ok) {
          alert(`Staff member added successfully with role: ${newStaffData.role}`);
          fetchStaff();
          setShowAddStaffModal(false);
          setNewStaffData({
            full_name: '', email: '', password: '', phone: '',
            department: 'service', position: '', base_salary: '', hourly_rate: '',
            role: 'staff', can_create_orders: true, can_generate_bills: true, can_access_kitchen: true
          });
        } else {
          const error = await staffResponse.json();
          alert('Failed to create staff profile: ' + JSON.stringify(error));
        }
      } else {
        const error = await userResponse.json();
        alert('Failed to create user account: ' + (error.error || JSON.stringify(error)));
      }
    } catch (error) {
      console.error('Error adding staff:', error);
      alert('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  // NEW: Edit Staff Role Function
  const editStaffRole = (staffMember) => {
    setEditingStaffRole({
      id: staffMember.user_id || staffMember.user,
      name: staffMember.full_name,
      current_role: staffMember.role || 'staff',
      role: staffMember.role || 'staff',
      can_create_orders: staffMember.can_create_orders || false,
      can_generate_bills: staffMember.can_generate_bills || false,
      can_access_kitchen: staffMember.can_access_kitchen || false
    });
    setShowRoleModal(true);
  };

  // NEW: Update Staff Role Function
  const updateStaffRole = async () => {
    if (!editingStaffRole) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/users/staff/${editingStaffRole.id}/update_permissions/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access}`
        },
        body: JSON.stringify({
          role: editingStaffRole.role,
          can_create_orders: editingStaffRole.can_create_orders,
          can_generate_bills: editingStaffRole.can_generate_bills,
          can_access_kitchen: editingStaffRole.can_access_kitchen
        })
      });

      if (response.ok) {
        alert(`Role updated successfully for ${editingStaffRole.name}`);
        fetchStaff();
        setShowRoleModal(false);
        setEditingStaffRole(null);
      } else {
        const error = await response.json();
        alert('Failed to update role: ' + (error.error || JSON.stringify(error)));
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  // NEW: Delete Staff Function
  const deleteStaff = async (staffId, staffName) => {
    if (!window.confirm(`Are you sure you want to delete ${staffName}? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/staff/profiles/${staffId}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.access}`
        }
      });

      if (response.ok) {
        alert('Staff member deleted successfully!');
        fetchStaff();
      } else {
        const error = await response.json();
        alert('Failed to delete staff: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      alert('Network error occurred');
    } finally {
      setLoading(false);
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
        alert(`Attendance marked as ${status} successfully!`);
      } else {
        alert('Failed to mark attendance');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const generatePayroll = async (staffId) => {
    setLoading(true);
    try {
      const response = await fetch('/api/staff/payroll/generate/', {
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

      const result = await response.json();
      if (result.success) {
        alert('Payroll generated successfully!');
        fetchStaff();
      } else {
        alert('Failed to generate payroll: ' + result.error);
      }
    } catch (error) {
      console.error('Error generating payroll:', error);
      alert('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceStatus = (staffId) => {
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendanceRecords.find(
      record => record.staff_id === staffId && record.date === today
    );
    return todayAttendance ? todayAttendance.status : 'not_marked';
  };

  const getMonthlyStats = (staffId) => {
    const staffAttendance = attendanceRecords.filter(record => record.staff_id === staffId);
    const present = staffAttendance.filter(record => record.status === 'present').length;
    const absent = staffAttendance.filter(record => record.status === 'absent').length;
    const totalHours = staffAttendance.reduce((sum, record) => sum + (record.total_hours || 0), 0);
    const overtimeHours = staffAttendance.reduce((sum, record) => sum + (record.overtime_hours || 0), 0);

    return { present, absent, totalHours, overtimeHours };
  };

  // NEW: Get role badge color
  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'waiter': return 'bg-blue-100 text-blue-800';
      case 'biller': return 'bg-green-100 text-green-800';
      case 'staff': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg">
        {/* UPDATED Header with Add Staff Button */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">ߑ Staff Management</h1>
              <p className="text-gray-600">Manage attendance, payroll, roles and staff information</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* NEW: Add Staff Button */}
              <button
                onClick={() => setShowAddStaffModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <span>ߑ</span> Add New Staff
              </button>
              
              <select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(Number(e.target.value))}
                className="border rounded px-3 py-2"
              >
                {Array.from({length: 12}, (_, i) => (
                  <option key={i + 1} value={i + 1}>
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
                  <option key={2022 + i} value={2022 + i}>
                    {2022 + i}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* UPDATED Navigation Tabs with Roles Tab */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {['overview', 'attendance', 'payroll', 'roles', 'advances'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* UPDATED Overview Tab with Role Badges and Delete Buttons */}
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
                        <h3 className="font-bold text-lg">{member.full_name}</h3>
                        <p className="text-sm text-gray-600">{member.position}</p>
                        <p className="text-xs text-gray-500">{member.employee_id}</p>
                        
                        {/* NEW: Role Badge */}
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getRoleBadgeColor(member.role || 'staff')}`}>
                          {(member.role || 'staff').toUpperCase()}
                        </span>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        attendanceStatus === 'present' ? 'bg-green-100 text-green-800' :
                        attendanceStatus === 'absent' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {attendanceStatus === 'not_marked' ? 'Not Marked' : attendanceStatus}
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Department:</span>
                        <span className="font-medium">{member.department}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Base Salary:</span>
                        <span className="font-medium">₹{member.base_salary}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Days Present:</span>
                        <span className="font-medium">{monthlyStats.present}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Hours:</span>
                        <span className="font-medium">{monthlyStats.totalHours.toFixed(1)}h</span>
                      </div>
                    </div>
                    
                    {/* UPDATED Quick Actions with New Buttons */}
                    <div className="mt-4 space-y-2">
                      {attendanceStatus === 'not_marked' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => markAttendance(member.id, 'present')}
                            disabled={loading}
                            className="flex-1 bg-green-500 text-white py-1 px-2 rounded text-xs hover:bg-green-600 disabled:opacity-50"
                          >
                            ✓ Present
                          </button>
                          <button
                            onClick={() => markAttendance(member.id, 'absent')}
                            disabled={loading}
                            className="flex-1 bg-red-500 text-white py-1 px-2 rounded text-xs hover:bg-red-600 disabled:opacity-50"
                          >
                            ✗ Absent
                          </button>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setSelectedStaff(member)}
                          className="bg-blue-500 text-white py-1 px-2 rounded text-xs hover:bg-blue-600"
                        >
                          ߓ Details
                        </button>
                        
                        {/* NEW: Edit Role Button */}
                        <button
                          onClick={() => editStaffRole(member)}
                          className="bg-purple-500 text-white py-1 px-2 rounded text-xs hover:bg-purple-600"
                        >
                          ߔ Role
                        </button>
                        
                        <button
                          onClick={() => generatePayroll(member.id)}
                          disabled={loading}
                          className="bg-green-500 text-white py-1 px-2 rounded text-xs hover:bg-green-600 disabled:opacity-50"
                        >
                          ߒ Payroll
                        </button>
                        
                        {/* NEW: Delete Button */}
                        <button
                          onClick={() => deleteStaff(member.id, member.full_name)}
                          disabled={loading}
                          className="bg-red-500 text-white py-1 px-2 rounded text-xs hover:bg-red-600 disabled:opacity-50"
                          title="Delete Staff"
                        >
                          ߗ️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* EXISTING Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left font-medium text-gray-900">Staff</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-900">Today Status</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-900">This Month</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-900">Total Hours</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-900">Overtime</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-900">Actions</th>
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
                            <div className="font-medium">{member.full_name}</div>
                            <div className="text-sm text-gray-500">{member.employee_id}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            attendanceStatus === 'present' ? 'bg-green-100 text-green-800' :
                            attendanceStatus === 'absent' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {attendanceStatus === 'not_marked' ? 'Not Marked' : attendanceStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <div>Present: {monthlyStats.present}</div>
                            <div>Absent: {monthlyStats.absent}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {monthlyStats.totalHours.toFixed(1)}h
                        </td>
                        <td className="px-4 py-3 font-medium text-orange-600">
                          {monthlyStats.overtimeHours.toFixed(1)}h
                        </td>
                        <td className="px-4 py-3">
                          {attendanceStatus === 'not_marked' && (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => markAttendance(member.id, 'present')}
                                disabled={loading}
                                className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 disabled:opacity-50"
                              >
                                Present
                              </button>
                              <button
                                onClick={() => markAttendance(member.id, 'absent')}
                                disabled={loading}
                                className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 disabled:opacity-50"
                              >
                                Absent
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

        {/* EXISTING Payroll Tab */}
        {activeTab === 'payroll' && (
          <div className="p-6">
            <div className="space-y-4">
              {staff.map(member => {
                const monthlyStats = getMonthlyStats(member.id);
                const baseSalary = parseFloat(member.base_salary);
                const overtimeAmount = monthlyStats.overtimeHours * parseFloat(member.hourly_rate || 0) * 1.5;
                const grossSalary = baseSalary + overtimeAmount;
                return (
                  <div key={member.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{member.full_name}</h3>
                        <p className="text-sm text-gray-600">{member.employee_id} - {member.position}</p>
                      </div>
                      <button
                        onClick={() => generatePayroll(member.id)}
                        disabled={loading}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                      >
                        {loading ? 'Generating...' : 'Generate Payroll'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="bg-gray-50 rounded p-3">
                        <div className="text-sm text-gray-600">Base Salary</div>
                        <div className="font-bold text-lg">₹{baseSalary.toFixed(2)}</div>
                      </div>
                      <div className="bg-orange-50 rounded p-3">
                        <div className="text-sm text-gray-600">Overtime</div>
                        <div className="font-bold text-lg text-orange-600">₹{overtimeAmount.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">{monthlyStats.overtimeHours.toFixed(1)}h</div>
                      </div>
                      <div className="bg-green-50 rounded p-3">
                        <div className="text-sm text-gray-600">Gross Salary</div>
                        <div className="font-bold text-lg text-green-600">₹{grossSalary.toFixed(2)}</div>
                      </div>
                      <div className="bg-blue-50 rounded p-3">
                        <div className="text-sm text-gray-600">Days Present</div>
                        <div className="font-bold text-lg text-blue-600">{monthlyStats.present}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* NEW: Roles Management Tab */}
        {activeTab === 'roles' && (
          <div className="p-6">
            <div className="bg-white rounded-lg">
              <div className="mb-4">
                <h2 className="text-xl font-bold">Staff Roles & Permissions</h2>
                <p className="text-gray-600">Manage roles and permissions for all staff members</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff Member</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Create Orders</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Generate Bills</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Access Kitchen</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {staff.map(member => (
                      <tr key={member.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{member.full_name}</div>
                          <div className="text-sm text-gray-500">{member.employee_id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role || 'staff')}`}>
                            {(member.role || 'staff').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-block w-3 h-3 rounded-full ${member.can_create_orders ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-block w-3 h-3 rounded-full ${member.can_generate_bills ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-block w-3 h-3 rounded-full ${member.can_access_kitchen ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => editStaffRole(member)}
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                          >
                            Edit Role
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* EXISTING Advances Tab */}
        {activeTab === 'advances' && (
          <div className="p-6">
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">ߒ Advance Payment Management</p>
              <p className="text-sm">Feature coming soon...</p>
            </div>
          </div>
        )}
      </div>

      {/* EXISTING Staff Detail Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{selectedStaff.full_name} - Details</h2>
              <button
                onClick={() => setSelectedStaff(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                  <div className="mt-1 text-sm">{selectedStaff.employee_id}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <div className="mt-1 text-sm">{selectedStaff.department}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Position</label>
                  <div className="mt-1 text-sm">{selectedStaff.position}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Base Salary</label>
                  <div className="mt-1 text-sm">₹{selectedStaff.base_salary}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hourly Rate</label>
                  <div className="mt-1 text-sm">₹{selectedStaff.hourly_rate}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1 text-sm">{selectedStaff.employment_status}</div>
                </div>
              </div>
              <div className="bg-gray-50 rounded p-4">
                <h3 className="font-medium mb-2">Monthly Performance</h3>
                <div className="text-sm text-gray-600">
                  Attendance chart and performance metrics would be displayed here
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Add Staff Modal with Role Selection */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New Staff Member</h2>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Full Name *"
                value={newStaffData.full_name}
                onChange={(e) => setNewStaffData({...newStaffData, full_name: e.target.value})}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              
              <input
                type="email"
                placeholder="Email *"
                value={newStaffData.email}
                onChange={(e) => setNewStaffData({...newStaffData, email: e.target.value})}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              
              <input
                type="password"
                placeholder="Password *"
                value={newStaffData.password}
                onChange={(e) => setNewStaffData({...newStaffData, password: e.target.value})}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              
              <input
                type="tel"
                placeholder="Phone"
                value={newStaffData.phone}
                onChange={(e) => setNewStaffData({...newStaffData, phone: e.target.value})}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />

              {/* NEW: Role Selection */}
              <select
                value={newStaffData.role}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="staff">Staff (Full Access)</option>
                <option value="waiter">Waiter (Orders Only)</option>
                <option value="biller">Biller (Bills Only)</option>
              </select>
              
              <select
                value={newStaffData.department}
                onChange={(e) => setNewStaffData({...newStaffData, department: e.target.value})}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="service">Service</option>
                <option value="kitchen">Kitchen</option>
                <option value="housekeeping">Housekeeping</option>
                <option value="management">Management</option>
                <option value="billing">Billing</option>
              </select>
              
              <input
                type="text"
                placeholder="Position"
                value={newStaffData.position}
                onChange={(e) => setNewStaffData({...newStaffData, position: e.target.value})}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              
              <input
                type="number"
                placeholder="Base Salary"
                value={newStaffData.base_salary}
                onChange={(e) => setNewStaffData({...newStaffData, base_salary: e.target.value})}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              
              <input
                type="number"
                placeholder="Hourly Rate"
                value={newStaffData.hourly_rate}
                onChange={(e) => setNewStaffData({...newStaffData, hourly_rate: e.target.value})}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />

              {/* NEW: Permission Checkboxes */}
              <div className="space-y-2 border-t pt-4">
                <label className="text-sm font-medium text-gray-700">Permissions:</label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newStaffData.can_create_orders}
                    onChange={(e) => setNewStaffData({...newStaffData, can_create_orders: e.target.checked})}
                  />
                  <span className="text-sm">Can Create Orders (Mobile Interface)</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newStaffData.can_generate_bills}
                    onChange={(e) => setNewStaffData({...newStaffData, can_generate_bills: e.target.checked})}
                  />
                  <span className="text-sm">Can Generate Bills</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newStaffData.can_access_kitchen}
                    onChange={(e) => setNewStaffData({...newStaffData, can_access_kitchen: e.target.checked})}
                  />
                  <span className="text-sm">Can Access Kitchen Display</span>
                </label>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={addNewStaff}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg disabled:opacity-50 transition-colors"
              >
                {loading ? 'Adding...' : 'Add Staff'}
              </button>
              
              <button
                onClick={() => {
                  setShowAddStaffModal(false);
                  setNewStaffData({
                    full_name: '', email: '', password: '', phone: '',
                    department: 'service', position: '', base_salary: '', hourly_rate: '',
                    role: 'staff', can_create_orders: true, can_generate_bills: true, can_access_kitchen: true
                  });
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Role Edit Modal */}
      {showRoleModal && editingStaffRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Role: {editingStaffRole.name}</h2>
            
            <div className="space-y-4">
              <select
                value={editingStaffRole.role}
                onChange={(e) => {
                  const role = e.target.value;
                  let permissions = {
                    can_create_orders: false,
                    can_generate_bills: false,
                    can_access_kitchen: false
                  };

                  switch(role) {
                    case 'admin':
                      permissions = {
                        can_create_orders: true,
                        can_generate_bills: true,
                        can_access_kitchen: true
                      };
                      break;
                    case 'waiter':
                      permissions = {
                        can_create_orders: true,
                        can_generate_bills: false,
                        can_access_kitchen: false
                      };
                      break;
                    case 'staff':
                      permissions = {
                        can_create_orders: true,
                        can_generate_bills: true,
                        can_access_kitchen: true
                      };
                      break;
                    case 'biller':
                      permissions = {
                        can_create_orders: false,
                        can_generate_bills: true,
                        can_access_kitchen: false
                      };
                      break;
                  }

                  setEditingStaffRole({
                    ...editingStaffRole,
                    role: role,
                    ...permissions
                  });
                }}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="staff">Staff (Full Access)</option>
                <option value="waiter">Waiter (Orders Only)</option>
                <option value="biller">Biller (Bills Only)</option>
              </select>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Permissions:</label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editingStaffRole.can_create_orders}
                    onChange={(e) => setEditingStaffRole({...editingStaffRole, can_create_orders: e.target.checked})}
                  />
                  <span className="text-sm">Can Create Orders (Mobile Interface)</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editingStaffRole.can_generate_bills}
                    onChange={(e) => setEditingStaffRole({...editingStaffRole, can_generate_bills: e.target.checked})}
                  />
                  <span className="text-sm">Can Generate Bills</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editingStaffRole.can_access_kitchen}
                    onChange={(e) => setEditingStaffRole({...editingStaffRole, can_access_kitchen: e.target.checked})}
                  />
                  <span className="text-sm">Can Access Kitchen Display</span>
                </label>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={updateStaffRole}
                disabled={loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg disabled:opacity-50 transition-colors"
              >
                {loading ? 'Updating...' : 'Update Role'}
              </button>
              
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setEditingStaffRole(null);
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
