// pages/notifications.js
import React from "react";

export default function Notifications() {
  return (
    <div className="flex">
      {/* Sidebar */}
      <div className="w-64 h-screen bg-blue-900 text-white p-5">
        <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>
        <ul>
          <li className="mb-4"><a href="/dashboard">Dashboard</a></li>
          <li className="mb-4"><a href="/menu-management">Menu Management</a></li>
          <li className="mb-4"><a href="/order-history">Order History</a></li>
          <li className="mb-4 font-bold underline"><a href="/notifications">Notifications</a></li>
        </ul>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6 bg-gray-100">
        <h1 className="text-3xl font-bold mb-6">Notifications</h1>

        <div className="space-y-4">
          <div className="bg-white rounded p-4 shadow border-l-4 border-blue-600">
            <p className="text-lg font-semibold">New order received from Room 102 🍽️</p>
            <p className="text-sm text-gray-500">2025-04-04 10:45 AM</p>
          </div>

          <div className="bg-white rounded p-4 shadow border-l-4 border-green-600">
            <p className="text-lg font-semibold">Payment successful for order #4523 💳</p>
            <p className="text-sm text-gray-500">2025-04-03 06:22 PM</p>
          </div>

          <div className="bg-white rounded p-4 shadow border-l-4 border-yellow-500">
            <p className="text-lg font-semibold">Room 205 checkout completed 🛏️</p>
            <p className="text-sm text-gray-500">2025-04-03 11:00 AM</p>
          </div>
        </div>
      </main>
    </div>
  );
}

