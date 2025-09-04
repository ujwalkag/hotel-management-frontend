import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import withRoleGuard from "@/hoc/withRoleGuard";

function ManageStaff() {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users/staff/", {
        headers: {
          Authorization: `Bearer ${user?.access}`,
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('Staff API Response:', data); // Debug log
        
        // ✅ FIX: Handle different response formats
        if (Array.isArray(data)) {
          setStaff(data);
        } else if (data.results && Array.isArray(data.results)) {
          setStaff(data.results);
        } else if (data.count !== undefined) {
          setStaff([]); // Empty array if no results
        } else {
          console.error('Unexpected staff data format:', data);
          setStaff([]);
        }
      } else {
        console.error('Staff API error:', res.status, res.statusText);
        setStaff([]);
        setMessage("❌ Failed to load staff / स्टाफ लोड करने में विफल");
      }
    } catch (err) {
      console.error("Error fetching staff list:", err);
      setStaff([]);
      setMessage("❌ Network error / नेटवर्क त्रुटि");
    } finally {
      setLoading(false);
    }
  };

  const addStaff = async () => {
    if (!email || !password) {
      setMessage("❌ Email and password required / ईमेल और पासवर्ड आवश्यक");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/users/staff/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.access}`,
        },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessage("✅ Staff added successfully / कर्मचारी सफलतापूर्वक जोड़ा गया");
        setEmail("");
        setPassword("");
        fetchStaff();
      } else {
        const data = await res.json();
        setMessage(`❌ Error: ${data?.error || "Something went wrong"} / त्रुटि: कुछ गलत हुआ`);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Network error / नेटवर्क त्रुटि");
    } finally {
      setLoading(false);
    }
  };

  const deleteStaff = async (id) => {
    if (!confirm('Are you sure you want to delete this staff member? / क्या आप वाकई इस स्टाफ सदस्य को हटाना चाहते हैं?')) return;
    
    try {
      setLoading(true);
      const res = await fetch(`/api/users/staff/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user?.access}`,
        },
      });
      
      if (res.ok) {
        setMessage("✅ Staff deleted successfully / स्टाफ सफलतापूर्वक हटाया गया");
        fetchStaff();
      } else {
        setMessage("❌ Failed to delete staff / स्टाफ हटाने में विफल");
      }
    } catch (err) {
      console.error("Failed to delete staff:", err);
      setMessage("❌ Network error during deletion / हटाने के दौरान नेटवर्क त्रुटि");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.access) fetchStaff();
  }, [user]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">ߑ Manage Staff / स्टाफ प्रबंधन</h1>

      {/* Add Staff Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">➕ Add Staff / कर्मचारी जोड़ें</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            placeholder="Email / ईमेल"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border px-4 py-2 rounded w-full"
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password / पासवर्ड"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border px-4 py-2 rounded w-full"
            disabled={loading}
          />
          <button
            onClick={addStaff}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? 'Adding... / जोड़ रहे हैं...' : 'Add / जोड़ें'}
          </button>
        </div>
        {message && (
          <div className={`mt-4 p-3 rounded ${message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}
      </div>

      {/* Staff List */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">ߓ Staff List / स्टाफ सूची</h2>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading staff... / स्टाफ लोड हो रहा है...</p>
          </div>
        ) : (
          <div className="divide-y">
            {Array.isArray(staff) && staff.length > 0 ? (
              staff.map((s) => (
                <div key={s.id} className="py-3 flex justify-between items-center">
                  <div>
                    <span className="font-medium">{s.email}</span>
                    <span className="text-gray-500 ml-2">
                      ({s.role || 'staff'} / {s.role === 'admin' ? 'व्यवस्थापक' : 'कर्मचारी'})
                    </span>
                  </div>
                  <button
                    onClick={() => deleteStaff(s.id)}
                    disabled={loading}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm disabled:opacity-50"
                  >
                    Delete / हटाएं
                  </button>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-center py-8">
                <div className="text-4xl mb-2">ߑ</div>
                <p>No staff members found / कोई स्टाफ सदस्य नहीं मिला</p>
                <p className="text-sm mt-1">Add your first staff member above / ऊपर अपना पहला स्टाफ सदस्य जोड़ें</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default withRoleGuard(ManageStaff, ["admin"]);

