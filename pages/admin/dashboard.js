// pages/admin/dashboard.js
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
        <h1 className="text-2xl font-semibold mb-4">Admin Dashboard</h1>

        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card title="Total Sales Today" value={`₹${summary.sales_today}`} />
            <Card title="Total Orders" value={summary.total_orders} />
            <Card title="Failed Payments" value={summary.failed_payments} />
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

const Card = ({ title, value }) => (
  <div className="bg-white p-4 rounded-xl shadow text-center">
    <h3 className="text-gray-500">{title}</h3>
    <p className="text-2xl font-bold mt-2">{value}</p>
  </div>
);

export default Dashboard;

