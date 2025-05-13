import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import withRoleGuard from "@/hoc/withRoleGuard";
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function AdminDashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState({ total_today: 0, total_week: 0, total_month: 0, total_bills: 0 });

  useEffect(() => {
    async function fetchSummary() {
      const res = await fetch('/api/bills/summary/', {
        headers: { Authorization: `Bearer ${user.access}` }
      });
      const data = await res.json();
      setSummary(data);
    }
    if (user) fetchSummary();
  }, [user]);

  const chartData = {
    labels: ['Today', 'This Week', 'This Month'],
    datasets: [
      {
        label: 'Total Sales (₹)',
        data: [summary.total_today, summary.total_week, summary.total_month],
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Sales Overview' },
    },
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="p-4 bg-blue-100 rounded shadow">
          <h2 className="text-lg">Today</h2>
          <p className="text-xl font-bold">₹{summary.total_today}</p>
        </div>
        <div className="p-4 bg-green-100 rounded shadow">
          <h2 className="text-lg">This Week</h2>
          <p className="text-xl font-bold">₹{summary.total_week}</p>
        </div>
        <div className="p-4 bg-yellow-100 rounded shadow">
          <h2 className="text-lg">This Month</h2>
          <p className="text-xl font-bold">₹{summary.total_month}</p>
        </div>
        <div className="p-4 bg-purple-100 rounded shadow">
          <h2 className="text-lg">Total Bills</h2>
          <p className="text-xl font-bold">{summary.total_bills}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <Bar options={chartOptions} data={chartData} />
      </div>
    </div>
  );
}

export default withRoleGuard(AdminDashboardPage, ['admin']);

