// pages/admin/dashboard.js
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import withRoleGuard from "@/hoc/withRoleGuard";
import Link from "next/link";

function AdminDashboard() {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState(null);
  const [inventoryStats, setInventoryStats] = useState({});
  const [recentInventoryEntries, setRecentInventoryEntries] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch("/api/bills/summary/", {
          headers: { Authorization: `Bearer ${user?.access}` },
        });
        const data = await res.json();
        setSummary(data);
      } catch (err) {
        console.error("Error loading summary");
      }
    };

    const fetchInventoryData = async () => {
      try {
        // ✅ NEW: Use the correct inventory API endpoint
        const statsRes = await fetch("/api/inventory/entries/dashboard_stats/", {
          headers: { Authorization: `Bearer ${user?.access}` },
        });
        
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setInventoryStats(statsData);
          setRecentInventoryEntries(statsData.recent_entries || []);
        }
      } catch (err) {
        console.error("Error loading inventory data:", err);
        // Set empty data if API fails
        setInventoryStats({
          current_month_spent: 0,
          total_categories: 0
        });
        setRecentInventoryEntries([]);
      }
    };

    if (user?.access) {
      fetchSummary();
      fetchInventoryData();
    }
  }, [user]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">ߏ Admin Dashboard / व्यवस्थापक डैशबोर्ड</h1>
        <button
          onClick={logout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout / लॉगआउट
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'dashboard'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          ߓ Dashboard / डैशबोर्ड
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'inventory'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          ߓ Stock Tracking / स्टॉक ट्रैकिंग
        </button>
      </div>

      {/* Dashboard Tab Content */}
      {activeTab === 'dashboard' && (
        <>
          {/* Billing Summary Stats */}
          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Total Today / आज का कुल" value={summary.total_today} />
              <StatCard label="This Week / इस सप्ताह" value={summary.total_week} />
              <StatCard label="This Month / इस माह" value={summary.total_month} />
              <StatCard label="Total Bills / कुल बिल" value={summary.total_bills} />
            </div>
          )}

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <LinkCard href="/admin/restaurant-billing" label="ߍ️ Restaurant Billing / रेस्टोरेंट बिलिंग" />
            <LinkCard href="/admin/manage-menu" label="ߓ Manage Menu / मेनू प्रबंधन" />
            <LinkCard href="/admin/manage-categories" label="ߓ Manage Categories / श्रेणी प्रबंधन" />
            <LinkCard href="/admin/manage-staff" label="ߑ Manage Staff / स्टाफ प्रबंधन" />
            <LinkCard href="/admin/room-billing" label="ߏ Room Billing / रूम बिलिंग" />
            <LinkCard href="/admin/manage-rooms" label="ߏ Manage Rooms / कमरा प्रबंधन" />
            <LinkCard href="/admin/bill-history" label="ߓ View Bill History / बिल इतिहास देखें" />
            <LinkCard href="/admin/analytics" label="ߓ Analytics Dashboard / विश्लेषण डैशबोर्ड" />
          </div>
        </>
      )}

      {/* NEW INVENTORY TAB - Stock Tracking System */}
      {activeTab === 'inventory' && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Stock Tracking Overview / स्टॉक ट्रैकिंग अवलोकन</h2>
            <div className="flex space-x-3">
              <Link 
                href="/admin/inventory-add-entry" 
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
              >
                ➕ Add Entry / एंट्री जोड़ें
              </Link>
              <Link 
                href="/admin/inventory" 
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
              >
                ߓ View All / सभी देखें
              </Link>
            </div>
          </div>

          {/* NEW: Inventory Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatCard 
              label="Current Month Spent / इस महीने खर्च" 
              value={parseFloat(inventoryStats.current_month_spent || 0).toLocaleString('en-IN')}
              color="text-purple-600"
              currency="₹"
            />
            <StatCard 
              label="Total Categories / कुल श्रेणियाँ" 
              value={inventoryStats.total_categories || 0}
              color="text-green-600"
              isCount={true}
            />
            <StatCard 
              label="Recent Entries / हाल की एंट्रियां" 
              value={recentInventoryEntries.length || 0}
              color="text-blue-600"
              isCount={true}
            />
          </div>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <QuickActionCard 
              href="/admin/inventory"
              icon="ߓ"
              title="All Entries"
              subtitle="सभी एंट्रियां"
              description="View all stock purchases"
            />
            <QuickActionCard 
              href="/admin/inventory-add-entry"
              icon="➕"
              title="Add Entry"
              subtitle="एंट्री जोड़ें"
              description="Record new purchase"
            />
            <QuickActionCard 
              href="/admin/inventory-categories"
              icon="ߓ"
              title="Categories"
              subtitle="श्रेणियाँ"
              description="Manage item categories"
            />
            <QuickActionCard 
              href="/admin/inventory"
              icon="ߓ"
              title="Reports"
              subtitle="रिपोर्ट"
              description="Monthly spending reports"
            />
          </div>

          {/* NEW: Recent Inventory Entries */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Recent Stock Entries / हाल की स्टॉक एंट्रियां</h3>
              <Link 
                href="/admin/inventory"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View All / सभी देखें →
              </Link>
            </div>

            {recentInventoryEntries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                        Date / दिनांक
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                        Item / आइटम
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                        Category / श्रेणी
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                        Quantity / मात्रा
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                        Total Cost / कुल लागत
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                        Supplier / आपूर्तिकर्ता
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentInventoryEntries.slice(0, 5).map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {new Date(entry.purchase_date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-4 py-2">
                          <div className="text-sm font-medium text-gray-900">{entry.item_name}</div>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {entry.category_name}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {entry.quantity}
                        </td>
                        <td className="px-4 py-2 text-sm font-semibold text-green-600">
                          ₹{parseFloat(entry.total_cost).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {entry.supplier_name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">ߓ</div>
                <p>No stock entries found / कोई स्टॉक एंट्री नहीं मिली</p>
                <Link 
                  href="/admin/inventory-add-entry"
                  className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add First Entry / पहली एंट्री जोड़ें
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, isCount = false, color = "text-blue-600", currency = "₹" }) {
  let displayValue;
  
  if (isCount) {
    displayValue = value?.toLocaleString("en-IN") || "0";
  } else {
    displayValue = `${currency} ${value?.toLocaleString("en-IN") || "0"}`;
  }
  
  return (
    <div className="p-4 bg-white border rounded-xl shadow text-center">
      <h2 className="text-lg font-semibold text-gray-600">{label}</h2>
      <p className={`text-2xl font-bold mt-2 ${color}`}>{displayValue}</p>
    </div>
  );
}

function LinkCard({ href, label }) {
  return (
    <Link
      href={href}
      className="block p-4 bg-white border rounded-xl shadow hover:shadow-lg transition"
    >
      <span className="text-lg font-medium text-gray-700">{label}</span>
    </Link>
  );
}

function QuickActionCard({ href, icon, title, subtitle, description }) {
  return (
    <Link
      href={href}
      className="block p-4 bg-white border rounded-xl shadow hover:shadow-lg transition"
    >
      <div className="text-center">
        <div className="text-3xl mb-2">{icon}</div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-500 mb-2">{subtitle}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
    </Link>
  );
}

export default withRoleGuard(AdminDashboard, ["admin"]);
