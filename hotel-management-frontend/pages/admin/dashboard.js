// pages/admin/dashboard.js
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import withRoleGuard from "@/hoc/withRoleGuard";
import Link from "next/link";

function AdminDashboard() {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState(null);
  const [inventorySummary, setInventorySummary] = useState(null);
  const [recentInventoryItems, setRecentInventoryItems] = useState([]);
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
        // Fetch inventory summary
        const summaryRes = await fetch("/api/inventory/items/stats/", {
          headers: { Authorization: `Bearer ${user?.access}` },
        });
        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          setInventorySummary(summaryData);
        }

        // Fetch recent inventory items
        const itemsRes = await fetch("/api/inventory/items/?limit=10", {
          headers: { Authorization: `Bearer ${user?.access}` },
        });
        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          setRecentInventoryItems(itemsData.results || itemsData || []);
        }
      } catch (err) {
        console.error("Error loading inventory data:", err);
      }
    };

    if (user?.access) {
      fetchSummary();
      fetchInventoryData();
    }
  }, [user]);

  const getStockStatus = (currentStock, minStock) => {
    if (currentStock === 0) {
      return { text: 'स्टॉक खत्म', color: 'text-red-600 bg-red-100' };
    } else if (currentStock <= minStock) {
      return { text: 'कम स्टॉक', color: 'text-yellow-600 bg-yellow-100' };
    } else {
      return { text: 'स्टॉक में', color: 'text-green-600 bg-green-100' };
    }
  };

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
          ߓ Inventory / इन्वेंट्री
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
            
            {/* Inventory Navigation Cards */}
            <LinkCard href="/admin/inventory" label="ߓ Inventory Items / इन्वेंट्री आइटम" />
            <LinkCard href="/admin/inventory-categories" label="ߓ Inventory Categories / इन्वेंट्री श्रेणी" />
            <LinkCard href="/admin/inventory-suppliers" label="ߏ Suppliers / आपूर्तिकर्ता" />
          </div>
        </>
      )}

      {/* Inventory Tab Content */}
      {activeTab === 'inventory' && (
        <>
          {/* Inventory Summary Stats */}
          {inventorySummary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard 
                label="Total Items / कुल आइटम" 
                value={inventorySummary.total_items || 0} 
                isCount={true}
              />
              <StatCard 
                label="Categories / श्रेणियाँ" 
                value={inventorySummary.total_categories || 0} 
                isCount={true}
              />
              <StatCard 
                label="Low Stock / कम स्टॉक" 
                value={inventorySummary.low_stock_count || 0} 
                isCount={true}
                color="text-yellow-600"
              />
              <StatCard 
                label="Out of Stock / स्टॉक खत्म" 
                value={inventorySummary.out_of_stock_count || 0} 
                isCount={true}
                color="text-red-600"
              />
            </div>
          )}

          {/* Recent Inventory Items */}
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Recent Inventory Items / हाल की इन्वेंट्री आइटम</h2>
              <Link 
                href="/admin/inventory"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View All / सभी देखें →
              </Link>
            </div>

            {recentInventoryItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                        Item Name / आइटम नाम
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                        Current Stock / वर्तमान स्टॉक
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                        Min Level / न्यूनतम स्तर
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                        Status / स्थिति
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                        Price / कीमत
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentInventoryItems.slice(0, 8).map((item) => {
                      const status = getStockStatus(item.current_stock || 0, item.min_stock_level || 0);
                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.name}</div>
                              <div className="text-xs text-gray-500">SKU: {item.sku}</div>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {item.current_stock || 0} {item.unit || ''}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {item.min_stock_level || 0} {item.unit || ''}
                          </td>
                          <td className="px-4 py-2">
                            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${status.color}`}>
                              {status.text}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            ₹{parseFloat(item.cost_per_unit || 0).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No inventory items found / कोई इन्वेंट्री आइटम नहीं मिला</p>
                <Link 
                  href="/admin/inventory"
                  className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Items / आइटम जोड़ें
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionCard 
              href="/admin/inventory" 
              icon="ߓ" 
              title="Manage Items"
              subtitle="आइटम प्रबंधन"
              description="Add, edit, or view inventory items"
            />
            <QuickActionCard 
              href="/admin/inventory-categories" 
              icon="ߓ" 
              title="Categories"
              subtitle="श्रेणियाँ"
              description="Organize items by categories"
            />
            <QuickActionCard 
              href="/admin/inventory-suppliers" 
              icon="ߏ" 
              title="Suppliers"
              subtitle="आपूर्तिकर्ता"
              description="Manage supplier information"
            />
            <QuickActionCard 
              href="/admin/inventory-alerts" 
              icon="⚠️" 
              title="Stock Alerts"
              subtitle="स्टॉक अलर्ट"
              description="Monitor low stock items"
            />
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, isCount = false, color = "text-blue-600" }) {
  const displayValue = isCount ? value?.toLocaleString("en-IN") : `₹ ${value?.toLocaleString("en-IN")}`;
  
  return (
    <div className="p-4 bg-white border rounded-xl shadow text-center">
      <h2 className="text-lg font-semibold text-gray-600">{label}</h2>
      <p className={`text-2xl font-bold ${color}`}>{displayValue}</p>
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
