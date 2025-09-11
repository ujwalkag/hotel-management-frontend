import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

export default function MenuManagement() {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [user]);

  const fetchData = async () => {
    try {
      const itemsRes = await fetch("/api/menu/items/", {
        headers: { Authorization: `Bearer ${user?.access}` },
      });
      const catsRes = await fetch("/api/menu/categories/", {
        headers: { Authorization: `Bearer ${user?.access}` },
      });
      setMenuItems(await itemsRes.json());
      setCategories(await catsRes.json());
    } catch {
      toast.error("Failed to load menu or categories");
    }
  };

  const filteredItems = selectedCategory
    ? menuItems.filter(
        (item) => item.category?.id === Number(selectedCategory)
      )
    : menuItems;

  return (
    <div className="flex">
      <div className="w-64 h-screen bg-blue-900 text-white p-5">
        <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>
        <ul>
          <li className="mb-4">
            <a href="/dashboard">Dashboard</a>
          </li>
          <li className="mb-4 font-bold underline">
            <a href="/menu-management">Menu Management</a>
          </li>
          <li className="mb-4">
            <a href="/order-history">Order History</a>
          </li>
          <li>
            <a href="/notifications">Notifications</a>
          </li>
        </ul>
      </div>

      <main className="flex-1 p-6 bg-gray-100">
        <h1 className="text-3xl font-bold mb-4">Menu Management</h1>

        <div className="mb-4 flex items-center gap-2">
          <label htmlFor="category" className="font-semibold">
            Filter by Category:
          </label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2 py-1 rounded border"
          >
            <option value="">All</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name_en}
              </option>
            ))}
          </select>
        </div>

        <table className="w-full table-auto bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-blue-200">
            <tr>
              <th className="text-left p-3">#</th>
              <th className="text-left p-3">Item Name</th>
              <th className="text-left p-3">Price</th>
              <th className="text-left p-3">Category</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item, index) => (
              <tr key={item.id} className="border-b hover:bg-gray-100">
                <td className="p-3">{index + 1}</td>
                <td className="p-3">{item.name_en}</td>
                <td className="p-3">₹{item.price}</td>
                <td className="p-3">
                  {item.category ? item.category.name_en : "Uncategorized"}
                </td>
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
