import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import withRoleGuard from "@/hoc/withRoleGuard";

function StaffBillHistory() {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const res = await fetch("/api/bills/history/", {
          headers: {
            Authorization: `Bearer ${user?.access}`,
          },
        });
        const data = await res.json();
        setBills(data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch bill history:", err);
      }
    };

    if (user?.access) {
      fetchBills();
    }
  }, [user]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">🧾 Bill History</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid gap-4">
          {bills.length === 0 ? (
            <p>No bills found.</p>
          ) : (
            bills.map((bill) => (
              <div key={bill.id} className="border p-4 rounded shadow">
                <p><strong>Room:</strong> {bill.room_name || "N/A"}</p>
                <p><strong>Type:</strong> {bill.bill_type || "N/A"}</p>
                <p><strong>Amount:</strong> ₹{bill.total_amount}</p>
                <p><strong>Created by:</strong> {bill.user_email}</p>
                <p><strong>Date:</strong> {new Date(bill.created_at).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default withRoleGuard(StaffBillHistory, "staff");

