import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

export default function OrderHistory() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [bills, setBills] = useState([]);

  useEffect(() => {
    async function fetchBills() {
      try {
        const res = await fetch("/api/bills/history/", {
          headers: { Authorization: `Bearer ${user?.access}` },
        });
        if (!res.ok) throw new Error("Failed to fetch bills");
        setBills(await res.json());
      } catch {
        toast.error("Failed to load bill history");
      }
    }
    if (user?.access) fetchBills();
  }, [user]);

  const filteredBills = bills.filter(
    (bill) =>
      bill.receipt_number.toLowerCase().includes(query.toLowerCase()) ||
      (bill.room_name && bill.room_name.includes(query))
  );

  return (
    <div className="flex">
      {/* Sidebar */}
      <div className="w-64 h-screen bg-blue-900 text-white p-5">
        <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>
        <ul>
          <li className="mb-4"><a href="/dashboard">Dashboard</a></li>
          <li className="mb-4"><a href="/menu-management">Menu Management</a></li>
          <li className="mb-4 font-bold underline"><a href="/order-history">Order History</a></li>
          <li className="mb-4"><a href="/notifications">Notifications</a></li>
        </ul>
      </div>
      {/* Main Content */}
      <main className="flex-1 p-6 bg-gray-100">
        <h1 className="text-3xl font-bold mb-6">Order / Bill History</h1>
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by Bill ID or Room"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="p-3 w-full border rounded shadow"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded shadow">
            <thead>
              <tr className="bg-blue-100 text-left">
                <th className="p-3">Bill ID</th>
                <th className="p-3">Room</th>
                <th className="p-3">Date</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.length > 0 ? (
                filteredBills.map((bill) => (
                  <tr key={bill.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">{bill.receipt_number}</td>
                    <td className="p-3">{bill.room_name || "-"}</td>
                    <td className="p-3">{new Date(bill.created_at).toLocaleDateString()}</td>
                    <td className="p-3">₹ {bill.total_amount.toFixed(2)}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 text-sm rounded ${
                          bill.status === "Paid" ? "bg-green-200 text-green-700" : "bg-red-200 text-red-700"
                        }`}
                      >
                        {bill.status || "Paid"}
                      </span>
                    </td>
                    <td className="p-3">
                      <a href={`/bills/${bill.id}`} className="text-blue-600 hover:underline">View</a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center p-6 text-gray-500">
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
