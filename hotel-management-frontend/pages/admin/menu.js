// pages/admin/menu.js
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import withRoleGuard from "@/hoc/withRoleGuard";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/DashboardLayout";

function ManageMenu() {
  const { user } = useAuth();
  const [menu, setMenu] = useState([]);
  const [newItem, setNewItem] = useState({ name: "", price: "" });

  const fetchMenu = async () => {
    try {
      const res = await fetch("/api/menu/", {
        headers: {
          Authorization: `Bearer ${user?.access}`,
        },
      });
      const data = await res.json();
      setMenu(data);
    } catch {
      toast.error("Failed to fetch menu");
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/menu/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.access}`,
        },
        body: JSON.stringify({
          name: newItem.name,
          price: parseFloat(newItem.price),
        }),
      });

      if (res.ok) {
        toast.success("Menu item created");
        setNewItem({ name: "", price: "" });
        fetchMenu();
      } else {
        toast.error("Failed to create menu item");
      }
    } catch {
      toast.error("Error occurred");
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/menu/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user?.access}`,
        },
      });
      if (res.ok) {
        toast.success("Item deleted");
        fetchMenu();
      }
    } catch {
      toast.error("Error deleting item");
    }
  };

  const handleEdit = async (id, updatedItem) => {
    try {
      const res = await fetch(`/api/menu/${id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.access}`,
        },
        body: JSON.stringify(updatedItem),
      });

      if (res.ok) {
        toast.success("Item updated");
        fetchMenu();
      }
    } catch {
      toast.error("Failed to update item");
    }
  };

  useEffect(() => {
    if (user?.access) fetchMenu();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">📋 Manage Menu</h1>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Name"
            value={newItem.name}
            onChange={(e) =>
              setNewItem({ ...newItem, name: e.target.value })
            }
            className="border px-2 py-1 rounded"
          />
          <input
            type="number"
            placeholder="Price"
            value={newItem.price}
            onChange={(e) =>
              setNewItem({ ...newItem, price: e.target.value })
            }
            className="border px-2 py-1 rounded"
          />
          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white px-4 py-1 rounded"
          >
            ➕ Add
          </button>
        </div>

        <ul>
          {menu.map((item) => (
            <li
              key={item.id}
              className="flex justify-between items-center border-b py-2"
            >
              <span>
                {item.name} – ₹{item.price}
              </span>
              <div className="space-x-2">
                <button
                  onClick={() =>
                    handleEdit(item.id, {
                      name: prompt("Name:", item.name),
                      price: prompt("Price:", item.price),
                    })
                  }
                  className="text-blue-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-red-600"
                >
                  Delete
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

