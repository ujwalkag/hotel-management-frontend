import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext"; // ✅ use auth context
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function Dashboard() {
  const router = useRouter();
  const { user, token, loading } = useAuth(); // ✅ Use global auth
  const [summary, setSummary] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [topItems, setTopItems] = useState([]);

  useEffect(() => {
    if (!loading && (!user || !["admin", "employee"].includes(user.role))) {
      router.push("/login"); // ✅ Redirect if not authenticated or unauthorized
    }
  }, [loading, user]);

  const fetchData = async () => {
    if (!token) return;

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    try {
      const [summaryRes, revenueRes, topItemsRes] = await Promise.all([
        fetch("/api/admin-dashboard/summary/", { headers }),
        fetch("/api/admin-dashboard/revenue/", { headers }),
        fetch("/api/admin-dashboard/top-items/", { headers }),
      ]);

      if (!summaryRes.ok || !revenueRes.ok || !topItemsRes.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const summaryData = await summaryRes.json();
      const revenueData = await revenueRes.json();
      const topItemsData = await topItemsRes.json();

      setSummary(summaryData);
      setRevenue(revenueData);
      setTopItems(topItemsData);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const revenueChartData = {
    labels: revenue?.map((entry) => entry.date) || [],
    datasets: [
      {
        label: "Revenue",
        data: revenue?.map((entry) => entry.total_revenue) || [],
        backgroundColor: "#4f46e5",
      },
    ],
  };

  if (loading || !user) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Dashboard ({user.role})</h1>

      {/* Summary Cards (only admin can see this) */}
      {user.role === "admin" && summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <SummaryCard title="Total Orders" value={summary.total_orders} />
          <SummaryCard title="Completed" value={summary.completed_orders} />
          <SummaryCard title="Pending" value={summary.pending_orders} />
          <SummaryCard title="Failed" value={summary.failed_orders} />
        </div>
      )}

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl shadow p-4 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Revenue Analytics</h2>
        <Bar data={revenueChartData} />
      </div>

      {/* Top Selling Items */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Top Selling Items</h2>
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="px-4 py-2">Item</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Quantity Sold</th>
            </tr>
          </thead>
          <tbody>
            {topItems?.map((item, idx) => (
              <tr key={idx} className="border-b">
                <td className="px-4 py-2">{item.name}</td>
                <td className="px-4 py-2">{item.category}</td>
                <td className="px-4 py-2">{item.quantity_sold}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow text-center">
      <h3 className="text-lg font-semibold text-gray-600">{title}</h3>
      <p className="text-2xl font-bold text-indigo-600">{value}</p>
    </div>
  );
}

