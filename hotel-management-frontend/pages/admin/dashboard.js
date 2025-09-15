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
  const [payrollSummary, setPayrollSummary] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    if (!user?.access) return;

    async function fetchSummary() {
      try {
        const res = await fetch("/api/bills/summary/", {
          headers: { Authorization: `Bearer ${user.access}` },
        });
        const data = await res.json();
        setSummary(data);
      } catch {
        console.error("Error loading summary");
      }
    }

    async function fetchInventoryData() {
      try {
        const statsRes = await fetch(
          "/api/inventory/entries/dashboard_stats/",
          { headers: { Authorization: `Bearer ${user.access}` } }
        );
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setInventoryStats(statsData);
          setRecentInventoryEntries(statsData.recent_entries || []);
        }
      } catch (err) {
        console.error("Error loading inventory data:", err);
        setInventoryStats({ current_month_spent: 0, total_categories: 0 });
        setRecentInventoryEntries([]);
      }
    }

    async function fetchPayrollData() {
      try {
        const payrollRes = await fetch("/api/staff-management/payroll-summary/", {
          headers: { Authorization: `Bearer ${user.access}` },
        });
        if (payrollRes.ok) {
          const payrollData = await payrollRes.json();
          setPayrollSummary(payrollData);
        }
      } catch (err) {
        console.error("Error loading payroll data:", err);
        setPayrollSummary(null);
      }
    }

    fetchSummary();
    fetchInventoryData();
    fetchPayrollData();
  }, [user]);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header with Logout */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          🏨 Admin Dashboard / व्यवस्थापक डैशबोर्ड
        </h1>
        <button
          onClick={logout}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          {user?.email} • Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "dashboard"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("inventory")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "inventory"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Inventory
            </button>
            <button
              onClick={() => setActiveTab("staff")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "staff"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Staff & Payroll
            </button>
          </nav>
        </div>
      </div>

      {/* Dashboard Tab */}
      {activeTab === "dashboard" && (
        <>
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatCard label="Today's Sales" value={summary.today_sales} />
              <StatCard label="Weekly Sales" value={summary.week_sales} />
              <StatCard label="Monthly Sales" value={summary.month_sales} />
              <StatCard
                label="Total Orders"
                value={summary.total_bills}
                isCount
              />
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
            <LinkCard href="/admin/restaurant-billing" label="Restaurant Billing" />
            <LinkCard href="/admin/room-billing" label="Room Billing" />
            <LinkCard href="/admin/manage-menu" label="Menu Management" />
            <LinkCard href="/admin/manage-rooms" label="Room Management" />
            <LinkCard href="/admin/manage-categories" label="Categories" />
            <LinkCard href="/admin/inventory" label="Inventory" />
            <LinkCard href="/admin/bill-history" label="Bill History" />
            <LinkCard href="/admin/employees" label="Access Management" />
            <LinkCard href="/admin/staff-management" label="Staff Management" />
	    <Link href="/admin/table-management">🏪 Table Management</Link>
	    <Link href="/admin/mobile-ordering">📱 Mobile Ordering</Link>
            <Link href="/admin/kitchen-display">🍳 Kitchen Display</Link>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <QuickActionCard
              href="/admin/restaurant-billing"
              icon="🍽️"
              title="Restaurant Billing"
              subtitle="Quick Service"
              description="Process restaurant orders and generate bills"
            />
            <QuickActionCard
              href="/admin/room-billing"
              icon="🏨"
              title="Room Billing"
              subtitle="Hotel Services"
              description="Manage room bookings and checkout"
            />
            <QuickActionCard
              href="/admin/employees"
              icon="👥"
              title="Access Management"
              subtitle="User Access"
              description="Manage Employee Access to Platform"
            />
            <QuickActionCard
              href="/admin/staff-management"
              icon="💼"
              title="Staff Management"
              subtitle="HR & Payroll"
              description="Manage staff, attendance, and payroll"
            />
          </div>
        </>
      )}

      {/* Inventory Tab */}
      {activeTab === "inventory" && (
        <>
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Stock Tracking / स्टॉक ट्रैकिंग
            </h2>
            <Link href="/admin/inventory-add-entry">
              <a className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                ➕ Add Purchase / खरीदारी जोड़ें
              </a>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              label="This Month Spent"
              value={inventoryStats.current_month_spent}
            />
            <StatCard
              label="Categories"
              value={inventoryStats.total_categories}
              isCount
            />
            <StatCard
              label="Recent Entries"
              value={recentInventoryEntries.length}
              isCount
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <LinkCard href="/admin/inventory-add-entry" label="➕ Add New Purchase" />
            <LinkCard href="/admin/inventory" label="📊 View All Inventory" />
          </div>
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Recent Purchases / हाल की खरीदारी
              </h3>
              <Link href="/admin/inventory">
                <a className="text-blue-600 hover:text-blue-800">
                  View All / सभी देखें →
                </a>
              </Link>
            </div>
            {recentInventoryEntries.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentInventoryEntries.slice(0, 5).map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(entry.purchase_date).toLocaleDateString(
                            "en-IN"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {entry.item_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {entry.category_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{parseFloat(entry.total_cost).toLocaleString("en-IN")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {entry.supplier_name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-4">📦</div>
                <p className="text-lg mb-4">
                  No purchases recorded yet / अभी तक कोई खरीदारी दर्ज नहीं की गई
                </p>
                <Link href="/admin/inventory-add-entry">
                  <a className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Add First Purchase / पहली खरीदारी जोड़ें
                  </a>
                </Link>
              </div>
            )}
          </div>
        </>
      )}

      {/* Staff & Payroll Tab */}
      {activeTab === "staff" && (
        <>
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Staff & Payroll Summary / कर्मचारी और वेतन सारांश
            </h2>
            <Link href="/admin/staff-management">
              <a className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                🏢 Staff Management
              </a>
            </Link>
          </div>

          {payrollSummary && (
            <>
              {/* Payroll Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard 
                  label="Total Employees / कुल कर्मचारी" 
                  value={payrollSummary.total_employees} 
                  isCount={true}
                  color="text-green-600"
                />
                <StatCard 
                  label="Monthly Payroll (Attendance) / मासिक वेतन (उपस्थिति)" 
                  value={payrollSummary.total_paid?.current_month_attendance || 0}
                  color="text-blue-600"
                />
                <StatCard 
                  label="Total Paid Till Date / कुल भुगतान" 
                  value={payrollSummary.total_paid?.till_date || 0}
                  color="text-purple-600"
                />
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <LinkCard href="/admin/staff-management/employees" label="👤 Manage Employees" />
                <LinkCard href="/admin/staff-management/attendance" label="📅 Daily Attendance" />
                <LinkCard href="/admin/staff-management/designations" label="💼 Designations" />
                <LinkCard href="/admin/staff-management/payroll" label="💰 Payroll Reports" />
              </div>

              {/* Designation-wise Summary Table */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Designation-wise Payroll Summary / पदवार वेतन सारांश
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Designation / पदनाम
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employees / कर्मचारी
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Daily Wage / दैनिक मजदूरी
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Monthly Salary / मासिक वेतन
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Monthly Total (Attendance) / मासिक कुल
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Till Date Total / कुल भुगतान
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payrollSummary.designations?.map((designation) => (
                        <tr key={designation.name}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {designation.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {designation.employee_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{designation.designation_daily_wage?.toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{designation.designation_monthly_salary?.toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{designation.monthly_total_by_attendance?.toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{designation.till_date_total?.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {!payrollSummary && (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-4">👥</div>
              <p className="text-lg mb-4">
                No staff data available / कोई कर्मचारी डेटा उपलब्ध नहीं
              </p>
              <Link href="/admin/staff-management">
                <a className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Set up Staff Management / स्टाफ मैनेजमेंट सेट करें
                </a>
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, isCount = false, color = "text-blue-600" }) {
  const display = isCount
    ? value?.toLocaleString("en-IN") || "0"
    : `₹ ${value?.toLocaleString("en-IN") || "0"}`;
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="text-sm font-medium text-gray-500">{label}</div>
      <div className={`${color} text-2xl font-bold mt-2`}>{display}</div>
    </div>
  );
}

function LinkCard({ href, label }) {
  return (
    <Link href={href}>
      <a className="block bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
        <div className="text-lg font-medium text-gray-900">{label}</div>
      </a>
    </Link>
  );
}

function QuickActionCard({ href, icon, title, subtitle, description }) {
  return (
    <Link href={href}>
      <a className="block bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
        <div className="flex items-center">
          <div className="text-3xl mr-4">{icon}</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-blue-600 font-medium">{subtitle}</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-600">{description}</p>
      </a>
    </Link>
  );
}

export default withRoleGuard(AdminDashboard, ["admin"]);

