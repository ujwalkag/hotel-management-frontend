import { useEffect, useState } from "react";
import withRoleGuard from "@/hoc/withRoleGuard";
import moment from "moment";

function BillingHistory() {
  const [bills, setBills] = useState([]);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bill/history/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setBills(data);
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Bill History</h1>
      {bills.length === 0 ? (
        <p className="text-gray-500">No bills found</p>
      ) : (
        <table className="w-full text-left border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">ID</th>
              <th className="p-2">Type</th>
              <th className="p-2">Total (₹)</th>
              <th className="p-2">Status</th>
              <th className="p-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((bill) => (
              <tr key={bill.id} className="border-t">
                <td className="p-2">{bill.id}</td>
                <td className="p-2 capitalize">{bill.order_type}</td>
                <td className="p-2">₹{bill.total_price}</td>
                <td className="p-2">{bill.status}</td>
                <td className="p-2">{moment(bill.created_at).format("YYYY-MM-DD HH:mm")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default withRoleGuard(BillingHistory, ["admin"]);

