import Layout from "@/components/Layout";
import { fetchOrderSummary, fetchSalesOverview, fetchBestSellingItems } from "@/utils/api";
import { useEffect, useState } from "react";

const Dashboard = () => {
  const [orderSummary, setOrderSummary] = useState<any>({});
  const [salesOverview, setSalesOverview] = useState<any>({});
  const [bestItems, setBestItems] = useState<any[]>([]);

  useEffect(() => {
    fetchOrderSummary().then(setOrderSummary);
    fetchSalesOverview().then(setSalesOverview);
    fetchBestSellingItems().then(setBestItems);
  }, []);

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Order Summary</h2>
          <p>Completed: {orderSummary.completed_orders}</p>
          <p>Pending: {orderSummary.pending_orders}</p>
          <p>Failed: {orderSummary.failed_orders}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Sales Overview</h2>
          <p>Daily: ${salesOverview.daily_sales}</p>
          <p>Weekly: ${salesOverview.weekly_sales}</p>
          <p>Monthly: ${salesOverview.monthly_sales}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Best-Selling Items</h2>
          <ul>
            {bestItems.map((item, index) => (
              <li key={index}>{item.item_name} - {item.total_sold} sold</li>
            ))}
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

