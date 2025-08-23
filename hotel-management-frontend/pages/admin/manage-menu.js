// pages/admin/manage-menu.js
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import withRoleGuard from "@/hoc/withRoleGuard";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/DashboardLayout";
import axios from "../../utils/axiosInstance";
function ManageMenu() {
  const { user } = useAuth();
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newItem, setNewItem] = useState({ name_en: "", name_hi: "", price: "", category_id: "" });
  const [editingItem, setEditingItem] = useState(null);

  const fetchMenu = async () => {
    const res = await fetch("/api/menu/items/", {
      headers: { Authorization: `Bearer ${user?.access}` },
    });
    if (res.ok) setMenu(await res.json());
    else toast.error("Failed to load menu");
  };

  const fetchCategories = async () => {
    const res = await fetch("/api/menu/categories/", {
      headers: { Authorization: `Bearer ${user?.access}` },
    });
    if (res.ok) {
      const data = await res.json();
      // This line ensures categories is always an array!
      setCategories(Array.isArray(data) ? data : data.results || []);
    }
    else toast.error("Failed to load categories");
  };

  const handleCreateOrUpdate = async () => {
    const item = editingItem || newItem;
    const method = editingItem ? "PUT" : "POST";
    const url = editingItem ? `/api/menu/items/${editingItem.id}/` : "/api/menu/items/";
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user?.access}`,
      },
      body: JSON.stringify({ ...item, price: Number(item.price) }),
    });

    if (res.ok) {
      toast.success(editingItem ? "Updated" : "Added");
      setEditingItem(null);
      setNewItem({ name_en: "", name_hi: "", price: "", category_id: "" });
      fetchMenu();
    } else toast.error("Failed to save item");
  };

  const handleDelete = async (id) => {
    const res = await fetch(`/api/menu/items/${id}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${user?.access}` },
    });
    if (res.ok) {
      toast.success("Item deleted");
      fetchMenu();
    } else toast.error("Failed to delete");
  };

  useEffect(() => {
    if (user?.access) {
      fetchMenu();
      fetchCategories();
    }
  }, [user]);

  const activeItem = editingItem || newItem;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">📋 Manage Menu (मेन्यू प्रबंधन)</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          <input
            type="text"
            placeholder="Name (English)"
            value={activeItem.name_en}
            onChange={(e) =>
              editingItem
                ? setEditingItem({ ...editingItem, name_en: e.target.value })
                : setNewItem({ ...newItem, name_en: e.target.value })
            }
            className="border px-2 py-1 rounded"
          />
          <input
            type="text"
            placeholder="नाम (Hindi)"
            value={activeItem.name_hi}
            onChange={(e) =>
              editingItem
                ? setEditingItem({ ...editingItem, name_hi: e.target.value })
                : setNewItem({ ...newItem, name_hi: e.target.value })
            }
            className="border px-2 py-1 rounded"
          />
          <input
            type="number"
            placeholder="Price (कीमत)"
            value={activeItem.price}
            onChange={(e) =>
              editingItem
                ? setEditingItem({ ...editingItem, price: e.target.value })
                : setNewItem({ ...newItem, price: e.target.value })
            }
            className="border px-2 py-1 rounded"
          />
          <select
            value={activeItem.category_id}
            onChange={(e) =>
              editingItem
                ? setEditingItem({ ...editingItem, category_id: e.target.value })
                : setNewItem({ ...newItem, category_id: e.target.value })
            }
            className="border px-2 py-1 rounded"
          >
            <option value="">Select Category (श्रेणी चुनें)</option>
            {(categories || []).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name_en} / {cat.name_hi}
              </option>
            ))}
            {(categories || []).length === 0 && (
              <option disabled>No categories found</option>
            )}
          </select>
        </div>

        <button
          onClick={handleCreateOrUpdate}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {editingItem ? "Update (अपडेट करें)" : "Add (जोड़ें)"}
        </button>

        <ul className="mt-6 space-y-2">
          {menu.map((item) => (
            <li key={item.id} className="flex justify-between items-center border-b pb-2">
              <span>
                {item.name_en} ({item.name_hi}) – ₹{item.price} ({item.category?.name_en || item.category?.name_hi || "No category"})
              </span>
              <div className="space-x-2">
                <button
                  onClick={() => setEditingItem({
                    id: item.id,
                    name_en: item.name_en,
                    name_hi: item.name_hi,
                    price: item.price,
                    category_id: item.category?.id || "",
                  })}
                  className="text-blue-600"
                >
                  Edit (संपादित करें)
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-red-600"
                >
                  Delete (हटाएं)
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </DashboardLayout>
  );
}

export default withRoleGuard(ManageMenu, "admin");
