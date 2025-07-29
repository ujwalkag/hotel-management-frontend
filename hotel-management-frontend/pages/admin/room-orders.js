// pages/admin/room-orders.js
import { useEffect, useState } from "react";
import withRoleGuard from "@/hoc/withRoleGuard";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";

function RoomOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/bills/summary/?type=room", {
          headers: {
            Authorization: `Bearer ${user?.access}`,
          },
        });
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        console.error("Failed to load room orders", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.access) fetchOrders();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">🛏️ Room Orders</h1>

        {loading ? (
          <p>Loading...</p>
        ) : orders.length === 0 ? (
          <p>No room orders found.</p>
        ) : (
          <ul className="space-y-4">
            {orders.map((bill) => (
              <li
                key={bill.id}
                className="border rounded p-4 shadow-sm bg-white"
              >
                <p className="font-semibold text-lg">
                  Room: {bill.room_name || bill.room_type}
                </p>
                <p>Duration: {bill.duration} hour(s)</p>
                <ul className="ml-4 list-disc">
                  {bill.items.map((item, i) => (
                    <li key={i}>
                      {item.name} × {item.quantity}
                    </li>
                  ))}
                </ul>
                <p className="font-semibold">Total: ₹ {bill.total_amount}</p>
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

export default withRoleGuard(RoomOrders, "admin");

