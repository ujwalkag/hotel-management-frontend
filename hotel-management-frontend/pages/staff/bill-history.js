import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import withRoleGuard from "@/hoc/withRoleGuard";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";
import toast from "react-hot-toast";

function StaffBillHistory() {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [filters, setFilters] = useState({
    start: "",
    end: "",
    type: "",
    search: "",
  });

  useEffect(() => {
    if (user?.access) fetchBills();
  }, [filters, user]);

  const fetchBills = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.start) params.append("start", filters.start);
      if (filters.end) params.append("end", filters.end);
      if (filters.type) params.append("type", filters.type);
      if (filters.search) params.append("search", filters.search);

      const res = await fetch(`/api/bills/history/?${params.toString()}`, {
        headers: { Authorization: `Bearer ${user.access}` },
      });

      if (!res.ok) {
        toast.error("Failed to fetch bills");
        setBills([]);
        return;
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        toast.error("Unexpected response format from server");
        setBills([]);
        return;
      }

      setBills(data);
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Error fetching bills");
      setBills([]);
    }
  };

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">📜 Staff Bill History</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <input
            type="date"
            name="start"
            value={filters.start}
            onChange={handleChange}
            className="border p-2 rounded"
            placeholder="Start Date"
          />
          <input
            type="date"
            name="end"
            value={filters.end}
            onChange={handleChange}
            className="border p-2 rounded"
            placeholder="End Date"
          />
          <select
            name="type"
            value={filters.type}
            onChange={handleChange}
            className="border p-2 rounded"
          >
            <option value="">All Types</option>
            <option value="restaurant">Restaurant</option>
            <option value="room">Room</option>
          </select>
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleChange}
            placeholder="Search by name, phone, or receipt"
            className="border p-2 rounded"
          />
        </div>

        {bills.length === 0 ? (
          <p className="text-gray-500">No bills found for this filter.</p>
        ) : (
          <ul className="space-y-4">
            {bills.map((bill) => (
              <li key={bill.id} className="border p-4 rounded shadow hover:bg-gray-50">
                <Link href={`/bills/${bill.id}`} className="block font-semibold text-blue-600">
                  {bill.receipt_number} — {bill.customer_name} ({bill.bill_type})
                </Link>
                <p className="text-sm text-gray-600">
                  ₹{bill.total_amount} • {new Date(bill.created_at).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">By: {bill.user_email}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardLayout>
  );
}

export default withRoleGuard(StaffBillHistory, ["staff"]);

