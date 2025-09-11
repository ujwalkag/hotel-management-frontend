import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import withRoleGuard from "@/hoc/withRoleGuard";
import toast from "react-hot-toast";

function BaseStaffManagement() {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "staff"
  });

  useEffect(() => {
    if (user?.access) fetchStaff();
  }, [user]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users/staff/", {
        headers: { Authorization: `Bearer ${user?.access}` },
      });
      const data = await res.json();
      setStaff(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      toast.error("Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.email.trim() || !form.password.trim()) {
      toast.error("Email and password are required");
      return;
    }

    try {
      setLoading(true);
      const method = editingStaff ? "PUT" : "POST";
      const url = editingStaff 
        ? `/api/users/staff/${editingStaff.id}/`
        : "/api/users/staff/";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.access}`,
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success(editingStaff ? "Staff updated" : "Staff created");
        setShowModal(false);
        setEditingStaff(null);
        setForm({ email: "", password: "", role: "staff" });
        fetchStaff();
      } else {
        const error = await res.json();
        toast.error("Failed to save: " + (error.error || "Unknown error"));
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/users/staff/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user?.access}` },
      });

      if (res.ok) {
        toast.success("Staff deleted");
        fetchStaff();
      } else {
        toast.error("Failed to delete staff");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (staffMember) => {
    setEditingStaff(staffMember);
    setForm({ 
      email: staffMember.email, 
      password: "", // Don't prefill password
      role: staffMember.role 
    });
    setShowModal(true);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">👥 Base Staff Management</h1>
            <p className="text-gray-600">Manage login accounts for staff members</p>
          </div>
          
          <button
            onClick={() => {
              setEditingStaff(null);
              setForm({ email: "", password: "", role: "staff" });
              setShowModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            disabled={loading}
          >
            ➕ Add Staff Account
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid gap-4">
              {staff.length > 0 ? (
                staff.map((member) => (
                  <div key={member.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-lg">{member.email}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            member.role === 'admin' ? 'bg-red-100 text-red-800' :
                            member.role === 'waiter' ? 'bg-blue-100 text-blue-800' :
                            member.role === 'biller' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {member.role?.toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            member.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {member.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        
                        <div className="flex gap-4 text-sm text-gray-600 mt-2">
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${member.can_create_orders ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span>Mobile Orders</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${member.can_generate_bills ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span>Generate Bills</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${member.can_access_kitchen ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span>Kitchen Access</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(member)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                          disabled={loading}
                        >
                          ✏️ Edit
                        </button>
                        
                        <button
                          onClick={() => handleDelete(member.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                          disabled={loading}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">👥</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No staff accounts found</h3>
                  <p className="text-gray-500">Create your first staff login account to get started</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingStaff ? "Edit Staff Account" : "Add New Staff Account"}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="staff@hotel.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingStaff ? "(leave blank to keep current)" : "*"}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({...form, password: e.target.value})}
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder={editingStaff ? "Leave blank to keep current" : "Enter password"}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({...form, role: e.target.value})}
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
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
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Saving...' : (editingStaff ? 'Update' : 'Create')}
              </button>
              
              <button
                onClick={() => setShowModal(false)}
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

export default withRoleGuard(BaseStaffManagement, "admin");
