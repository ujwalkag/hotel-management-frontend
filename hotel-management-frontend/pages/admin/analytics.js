import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import withRoleGuard from "@/hoc/withRoleGuard";
import DashboardLayout from "@/components/DashboardLayout";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

function AdminAnalytics() {
  const { user } = useAuth();
  const [summary, setSummary] = useState({});
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (user?.access) {
      fetchSummary();
      fetchChartData();
    }
  }, [user]);

  const fetchSummary = async () => {
    try {
      const res = await fetch("/api/bills/summary/", {
        headers: { Authorization: `Bearer ${user.access}` },
      });
      const data = await res.json();
      setSummary(data);
    } catch {
      console.error("Failed to load summary");
    }
  };

  const fetchChartData = async () => {
    try {
      const res = await fetch("/api/bills/analytics/?range=7", {
        headers: { Authorization: `Bearer ${user.access}` },
      });
      const data = await res.json();
      setChartData(data);
    } catch {
      console.error("Failed to load chart");
    }
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `₹${context.raw}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `₹${value}`,
        },
      },
    },
  };

  const revenueChart = {
    labels: chartData.map((d) => d.date),
    datasets: [
      {
        label: "Revenue (₹)",
        data: chartData.map((d) => d.total),
        fill: false,
        borderColor: "#3b82f6",
        backgroundColor: "#3b82f6",
        tension: 0.3,
      },
    ],
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">📊 Admin Analytics</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Today" value={summary.total_today} />
          <StatCard label="This Week" value={summary.total_week} />
          <StatCard label="This Month" value={summary.total_month} />
          <StatCard label="Total Bills" value={summary.total_bills} />
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">📈 Revenue (Last 7 Days)</h2>
          <Line data={revenueChart} options={chartOptions} />
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white border rounded p-4 shadow text-center">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-bold">₹{value ?? 0}</p>
    </div>
  );
}

export default withRoleGuard(AdminAnalytics, ["admin"]);

