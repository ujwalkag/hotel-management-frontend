import { useEffect, useState } from "react";
import withRoleGuard from "@/utils/withRoleGuard";

function AdminMenu() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", price: "", category: "main" });

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/menu/list/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setItems(data);
  };

  const deleteItem = async (id) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/menu/delete/${id}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchItems();
  };

  const startEdit = (item) => {
    setEditing(item.id);
    setEditForm({ name: item.name, price: item.price, category: item.category });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/menu/update/${editing}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(editForm),
    });
    setEditing(null);
    fetchItems();
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-6">Menu Items</h1>

      {items.map((item) =>
        editing === item.id ? (
          <form key={item.id} onSubmit={handleUpdate} className="mb-4">
            <input
              className="border p-2 mr-2"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              required
            />
            <input
              className="border p-2 mr-2"
              type="number"
              value={editForm.price}
              onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
              required
            />
            <select
              className="border p-2 mr-2"
              value={editForm.category}
              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
            >
              <option value="main">Main</option>
              <option value="snack">Snack</option>
              <option value="beverage">Beverage</option>
            </select>
            <button className="bg-green-600 text-white px-4 py-1 rounded">Save</button>
          </form>
        ) : (
          <div key={item.id} className="flex justify-between items-center border-b py-2">
            <div>
              <p className="font-semibold">{item.name} — ₹{item.price}</p>
              <p className="text-sm text-gray-500">{item.category}</p>
            </div>
            <div className="space-x-2">
              <button onClick={() => startEdit(item)} className="text-blue-600">Edit</button>
              <button onClick={() => deleteItem(item.id)} className="text-red-600">Delete</button>
            </div>
          </div>
        )
      )}
    </div>
  );
}

export default withRoleGuard(AdminMenu, ["admin"]);

