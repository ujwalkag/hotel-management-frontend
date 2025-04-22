// pages/order-history.js
import React, { useState } from "react";

const mockOrders = [
  {
    id: "BILL-1001",
    room: "101",
    date: "2025-04-04",
    status: "Paid",
    amount: 1240.0,
  },
  {
    id: "BILL-1002",
    room: "202",
    date: "2025-04-03",
    status: "Unpaid",
    amount: 845.0,
  },
  {
    id: "BILL-1003",
    room: "305",
    date: "2025-04-02",
    status: "Paid",
    amount: 1999.0,
  },
];

export default function OrderHistory() {
  const [query, setQuery] = useState("");

  const filteredOrders = mockOrders.filter((order) =>
    order.id.toLowerCase().includes(query.toLowerCase()) ||
    order.room.includes(query)
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

        {/* Search bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by Bill ID or Room No"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="p-3 w-full border rounded shadow"
          />
        </div>

        {/* Orders Table */}
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
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">{order.id}</td>
                    <td className="p-3">{order.room}</td>
                    <td className="p-3">{order.date}</td>
                    <td className="p-3">₹ {order.amount.toFixed(2)}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 text-sm rounded ${
                          order.status === "Paid" ? "bg-green-200 text-green-700" : "bg-red-200 text-red-700"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <a href="#" className="text-blue-600 hover:underline">View</a>
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

