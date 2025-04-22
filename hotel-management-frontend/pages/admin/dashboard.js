import withRoleGuard from '@/utils/withRoleGuard';
import { useEffect, useState } from "react";
import axios from "@/utils/axiosInstance";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import AdminLayout from "@/components/layouts/AdminLayout";
import Link from "next/link";

ChartJS.register(BarElement, CategoryScale, LinearScale, ArcElement, Tooltip, Legend);

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [bestSellers, setBestSellers] = useState([]);
  const [revenueData, setRevenueData] = useState({ labels: [], data: [] });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, bestRes, revenueRes] = await Promise.all([
          axios.get("/api/admin/dashboard/summary/"),
          axios.get("/api/admin/dashboard/best-selling/"),
          axios.get("/api/admin/dashboard/revenue/"),
        ]);
        setSummary(summaryRes.data);
        setBestSellers(bestRes.data.items);
        setRevenueData({
          labels: revenueRes.data.labels,
          data: revenueRes.data.values,
        });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      }
    };
    fetchData();
  }, []);

  return (
    <AdminLayout>
      <div className="p-4">
        <h1 className="text-2xl font-semibold mb-6">Admin Dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <NavCard title="Rooms" link="/admin/rooms" />
          <NavCard title="Orders" link="/admin/orders" />
          <NavCard title="Menu" link="/admin/menu" />
          <NavCard title="Billing" link="/admin/billing" />
        </div>

        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatCard title="Total Sales Today" value={`₹${summary.sales_today}`} />
            <StatCard title="Total Orders" value={summary.total_orders} />
            <StatCard title="Failed Payments" value={summary.failed_payments} />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-4 shadow">
            <h2 className="text-lg font-semibold mb-2">Revenue Overview</h2>
            <Bar
              data={{
                labels: revenueData.labels,
                datasets: [
                  {
                    label: "₹ Revenue",
                    data: revenueData.data,
                    backgroundColor: "rgba(59, 130, 246, 0.6)",
                  },
                ],
              }}
              options={{ responsive: true }}
            />
          </div>

          <div className="bg-white rounded-xl p-4 shadow">
            <h2 className="text-lg font-semibold mb-2">Best Selling Items</h2>
            <Doughnut
              data={{
                labels: bestSellers.map((item) => item.name),
                datasets: [
                  {
                    data: bestSellers.map((item) => item.count),
                    backgroundColor: [
                      "#3B82F6",
                      "#10B981",
                      "#F59E0B",
                      "#EF4444",
                      "#8B5CF6",
                    ],
                  },
                ],
              }}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

// 💡 Reusable stat card
const StatCard = ({ title, value }) => (
  <div className="bg-white p-4 rounded-xl shadow text-center">
    <h3 className="text-gray-500">{title}</h3>
    <p className="text-2xl font-bold mt-2">{value}</p>
  </div>
);

// 💡 Reusable nav card (acts as a button link)
const NavCard = ({ title, link }) => (
  <Link href={link}>
    <a className="bg-blue-50 hover:bg-blue-100 transition-all p-4 rounded-xl shadow text-center block">
      <h3 className="text-blue-700 font-medium">{title}</h3>
    </a>
  </Link>
);

export default withRoleGuard(Dashboard, ['admin']);

