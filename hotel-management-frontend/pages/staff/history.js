import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import withRoleGuard from "@/hoc/withRoleGuard";

function BillHistoryPage() {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);

  useEffect(() => {
    async function fetchBills() {
      const res = await fetch('/api/bills/history/', {
        headers: {
          Authorization: `Bearer ${user.access}`
        }
      });
      const data = await res.json();
      setBills(data);
    }
    if (user) fetchBills();
  }, [user]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Bill History</h1>

      {bills.map((bill) => (
        <div key={bill.id} className="p-4 border rounded mb-4">
          <h2 className="font-semibold">{bill.bill_type.toUpperCase()} - ₹{bill.total_amount}</h2>
          <p className="text-gray-500 mb-2">{new Date(bill.created_at).toLocaleString()}</p>
          {bill.items.map((item, index) => (
            <div key={index} className="text-sm">
              {item.item_name} x {item.quantity} — ₹{item.price}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default withRoleGuard(BillHistoryPage, ['staff']);

