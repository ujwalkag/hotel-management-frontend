// pages/menu-management.js
import { useState, useEffect } from "react";

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    // Placeholder for fetching from backend
    const dummyData = [
      { id: 1, name: "Paneer Butter Masala", price: 250 },
      { id: 2, name: "Chicken Biryani", price: 300 },
      { id: 3, name: "Tandoori Roti", price: 20 },
    ];
    setMenuItems(dummyData);
  }, []);

  return (
    <div className="flex">
      <div className="w-64 h-screen bg-blue-900 text-white p-5">
        <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>
        <ul>
          <li className="mb-4"><a href="/dashboard">Dashboard</a></li>
          <li className="mb-4 font-bold underline"><a href="/menu-management">Menu Management</a></li>
          <li className="mb-4"><a href="/order-history">Order History</a></li>
          <li><a href="/notifications">Notifications</a></li>
        </ul>
      </div>

      <main className="flex-1 p-6 bg-gray-100">
        <h1 className="text-3xl font-bold mb-4">Menu Management</h1>
        <table className="w-full table-auto bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-blue-200">
            <tr>
              <th className="text-left p-3">#</th>
              <th className="text-left p-3">Item Name</th>
              <th className="text-left p-3">Price</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {menuItems.map((item, index) => (
              <tr key={item.id} className="border-b hover:bg-gray-100">
                <td className="p-3">{index + 1}</td>
                <td className="p-3">{item.name}</td>
                <td className="p-3">₹{item.price}</td>
                <td className="p-3 text-blue-600">
                  <button className="mr-3 hover:underline">Edit</button>
                  <button className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}

