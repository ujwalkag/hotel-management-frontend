import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import withRoleGuard from "@/hoc/withRoleGuard";

function AdminMenuPage() {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", price: "", category_id: "", available: true });

  useEffect(() => {
    fetchMenu();
    fetchCategories();
  }, [user]);

  async function fetchMenu() {
    const res = await fetch('/api/menu/items/', {
      headers: { Authorization: `Bearer ${user.access}` }
    });
    const data = await res.json();
    setMenuItems(data);
  }

  async function fetchCategories() {
    const res = await fetch('/api/menu/categories/', {
      headers: { Authorization: `Bearer ${user.access}` }
    });
    const data = await res.json();
    setCategories(data);
  }

  async function handleAdd() {
    const res = await fetch('/api/menu/items/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.access}` },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      setForm({ name: "", description: "", price: "", category_id: "", available: true });
      fetchMenu();
      alert("Item Added!");
    } else {
      alert("Failed to add item.");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this item?")) return;
    await fetch(`/api/menu/items/${id}/`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user.access}` }
    });
    fetchMenu();
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Menu Management</h1>

      <div className="mb-8">
        <input
          className="border p-2 mr-2"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="border p-2 mr-2"
          placeholder="Price"
          type="number"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />
        <select
          className="border p-2 mr-2"
          value={form.category_id}
          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
        >
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <button onClick={handleAdd} className="bg-green-600 text-white p-2 rounded">
          Add Menu Item
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {menuItems.map(item => (
          <div key={item.id} className="border p-4 flex justify-between items-center">
            <div>
              <p className="font-bold">{item.name}</p>
              <p className="text-gray-500">₹{item.price}</p>
              {item.category && <p className="text-sm text-gray-400">{item.category.name}</p>}
            </div>
            <button onClick={() => handleDelete(item.id)} className="text-red-600">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default withRoleGuard(AdminMenuPage, ['admin']);

