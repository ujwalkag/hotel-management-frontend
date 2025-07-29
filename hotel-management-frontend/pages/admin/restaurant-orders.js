// pages/admin/restaurant-orders.js
import { useEffect, useState } from "react";
import withRoleGuard from "@/hoc/withRoleGuard";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";

function RestaurantOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/bills/summary/?type=restaurant", {
          headers: {
            Authorization: `Bearer ${user?.access}`,
          },
        });
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        console.error("Failed to load restaurant orders");
      } finally {
        setLoading(false);
      }
    };

    if (user?.access) fetchOrders();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">🍽️ Restaurant Orders</h1>

        {loading ? (
          <p>Loading...</p>
        ) : orders.length === 0 ? (
          <p>No restaurant orders found.</p>
        ) : (
          <ul className="space-y-4">
            {orders.map((bill) => (
              <li
                key={bill.id}
                className="border rounded p-4 shadow-sm bg-white"
              >
                <p className="font-semibold text-lg">Total: ₹ {bill.total_amount}</p>
                <ul className="ml-4 list-disc">
                  {bill.items.map((item, i) => (
                    <li key={i}>
                      {item.name} × {item.quantity}
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-gray-500">
                  Date: {new Date(bill.created_at).toLocaleString("en-IN")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardLayout>
  );
}

export default withRoleGuard(RestaurantOrders, "admin");

