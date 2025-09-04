import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import withRoleGuard from "@/hoc/withRoleGuard";
import toast from "react-hot-toast";

function ManageStaff() {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Forms
  const [newStaff, setNewStaff] = useState({
    email: "",
    password: "",
    role: "staff"
  });
  const [editingStaff, setEditingStaff] = useState(null);

  const fetchStaff = async () => {
    if (!user?.access) return;
    
    try {
      setLoading(true);
      const res = await fetch("/api/users/staff/", {
        headers: { Authorization: `Bearer ${user.access}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('Staff data:', data);
        setStaff(Array.isArray(data) ? data : data.results || []);
      } else {
        console.error('Staff API error:', res.status);
        toast.error("Failed to load staff");
      }
    } catch (err) {
      console.error("Error fetching staff:", err);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const addStaff = async () => {
    if (!newStaff.email || !newStaff.password) {
      toast.error("Email and password are required");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/users/staff/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.access}`,
        },
        body: JSON.stringify(newStaff),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`${newStaff.role.toUpperCase()} created successfully!`);
        setNewStaff({ email: "", password: "", role: "staff" });
        setShowAddModal(false);
        fetchStaff();
      } else {
        const errorData = await res.json();
        toast.error(`Error: ${errorData?.error || "Something went wrong"}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const updateStaffRole = async () => {
    if (!editingStaff) return;
    
    try {
      setLoading(true);
      const res = await fetch(`/api/users/staff/${editingStaff.id}/update_permissions/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access}`,
        },
        body: JSON.stringify({
          role: editingStaff.role,
          can_create_orders: editingStaff.can_create_orders,
          can_generate_bills: editingStaff.can_generate_bills,
          can_access_kitchen: editingStaff.can_access_kitchen
        })
      });

      if (res.ok) {
        toast.success(`Role updated for ${editingStaff.email}`);
        setShowEditModal(false);
        setEditingStaff(null);
        fetchStaff();
      } else {
        const error = await res.json();
        toast.error('Failed to update role: ' + (error.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const deleteStaff = async (id, email) => {
    if (!confirm(`Are you sure you want to delete ${email}?`)) return;
    
    try {
      setLoading(true);
      const res = await fetch(`/api/users/staff/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.access}` },
      });
      
      if (res.ok) {
        toast.success("Staff deleted successfully");
        fetchStaff();
      } else {
        const error = await res.json();
        toast.error("Failed to delete: " + (error.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Failed to delete staff:", err);
      toast.error("Network error during deletion");
    } finally {
      setLoading(false);
    }
  };

  // Auto-assign permissions based on role
  const handleRoleChange = (role, isEditing = false) => {
    let permissions = {
      can_create_orders: false,
      can_generate_bills: false,
      can_access_kitchen: false
    };

    switch(role) {
      case 'admin':
        permissions = { can_create_orders: true, can_generate_bills: true, can_access_kitchen: true };
        break;
      case 'waiter':
        permissions = { can_create_orders: true, can_generate_bills: false, can_access_kitchen: false };
        break;
      case 'staff':
        permissions = { can_create_orders: true, can_generate_bills: true, can_access_kitchen: true };
        break;
      case 'biller':
        permissions = { can_create_orders: false, can_generate_bills: true, can_access_kitchen: false };
        break;
    }

    if (isEditing && editingStaff) {
      setEditingStaff({ ...editingStaff, role, ...permissions });
    } else {
      setNewStaff({ ...newStaff, role });
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [user]);

  const canManageStaff = user?.role === 'admin' || user?.can_generate_bills;

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ߑ Staff Role Management</h1>
              <p className="mt-1 text-sm text-gray-600">Add, edit, and manage staff roles and permissions</p>
            </div>
            
            {canManageStaff && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                disabled={loading}
              >
                <span>➕</span> Add Staff
              </button>
            )}
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
                  staff.map((s) => (
                    <div key={s.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{s.email}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              s.role === 'admin' ? 'bg-red-100 text-red-800' :
                              s.role === 'waiter' ? 'bg-blue-100 text-blue-800' :
                              s.role === 'biller' ? 'bg-green-100 text-green-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {s.role?.toUpperCase() || 'STAFF'}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              s.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {s.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          
                          {/* Permissions */}
                          <div className="flex gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${s.can_create_orders ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              <span>Mobile Orders</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${s.can_generate_bills ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              <span>Generate Bills</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${s.can_access_kitchen ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              <span>Kitchen Access</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        {canManageStaff && (
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => {
                                setEditingStaff({
                                  id: s.id,
                                  email: s.email,
                                  role: s.role || 'staff',
                                  can_create_orders: s.can_create_orders || false,
                                  can_generate_bills: s.can_generate_bills || false,
                                  can_access_kitchen: s.can_access_kitchen || false
                                });
                                setShowEditModal(true);
                              }}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                              disabled={loading}
                            >
                              ✏️ Edit Role
                            </button>
                            
                            <button
                              onClick={() => deleteStaff(s.id, s.email)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                              disabled={loading}
                            >
                              ߗ️ Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">ߑ</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members</h3>
                    <p className="text-gray-500">Add your first staff member to get started.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">➕ Add New Staff</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({...newStaff, password: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={newStaff.role}
                  onChange={(e) => handleRoleChange(e.target.value, false)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="staff">Staff (Full Access)</option>
                  <option value="waiter">Waiter (Orders Only)</option>
                  <option value="biller">Biller (Bills Only)</option>
                  <option value="admin">Admin (All Access)</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={addStaff}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg disabled:opacity-50 transition-colors"
              >
                {loading ? 'Adding...' : 'Add Staff'}
              </button>
              
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewStaff({ email: "", password: "", role: "staff" });
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditModal && editingStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">✏️ Edit Role: {editingStaff.email}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={editingStaff.role}
                  onChange={(e) => handleRoleChange(e.target.value, true)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="staff">Staff (Full Access)</option>
                  <option value="waiter">Waiter (Orders Only)</option>
                  <option value="biller">Biller (Bills Only)</option>
                  <option value="admin">Admin (All Access)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingStaff.can_create_orders}
                      onChange={(e) => setEditingStaff({...editingStaff, can_create_orders: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">Can Create Orders (Mobile Interface)</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingStaff.can_generate_bills}
                      onChange={(e) => setEditingStaff({...editingStaff, can_generate_bills: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">Can Generate Bills</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingStaff.can_access_kitchen}
                      onChange={(e) => setEditingStaff({...editingStaff, can_access_kitchen: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">Can Access Kitchen Display</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={updateStaffRole}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg disabled:opacity-50 transition-colors"
              >
                {loading ? 'Updating...' : 'Update Role'}
              </button>
              
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingStaff(null);
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors"
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

export default withRoleGuard(ManageStaff, ["admin", "staff"]);
