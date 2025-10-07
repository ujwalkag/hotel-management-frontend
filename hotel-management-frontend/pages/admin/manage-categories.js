// pages/admin/manage-categories.js
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import withRoleGuard from "@/hoc/withRoleGuard";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/DashboardLayout";

function ManageCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [nameEn, setNameEn] = useState("");
  const [nameHi, setNameHi] = useState("");

  // Always set categories as an array (supports paginated and non-paginated responses)
  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/restaurant/menu-categories/", {
        headers: {
          Authorization: `Bearer ${user?.access}`,
        },
      });
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      toast.error("⚠️ Failed to load categories");
    }
  };

  const handleCreate = async () => {
    if (!nameEn.trim() || !nameHi.trim()) {
      toast.error("Both English and Hindi names are required.");
      return;
    }

    try {
      const res = await fetch("/api/restaurant/menu-categories/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.access}`,
        },
         body: JSON.stringify({
         	name:    nameEn.trim(),
         	name_en: nameEn.trim(),
         	name_hi: nameHi.trim()
       }),
      });
      if (res.ok) {
        toast.success("✅ Category created");
        setNameEn("");
        setNameHi("");
        fetchCategories();
      } else {
        toast.error("❌ Failed to create category");
      }
    } catch {
      toast.error("❌ Error creating category");
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/restaurant/menu-categories/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user?.access}`,
        },
      });
      if (res.ok) {
        toast.success("🗑️ Deleted");
        fetchCategories();
      } else {
        toast.error("❌ Failed to delete");
      }
    } catch {
      toast.error("❌ Error deleting");
    }
  };

  useEffect(() => {
    if (user?.access) fetchCategories();
    // eslint-disable-next-line
  }, [user]);

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">📂 Manage Categories (श्रेणियाँ प्रबंधन)</h1>

        <div className="grid sm:grid-cols-2 gap-2 mb-6">
          <input
            type="text"
            placeholder="Category Name (English)"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            className="border px-3 py-1 rounded w-full"
          />
          <input
            type="text"
            placeholder="श्रेणी नाम (हिंदी)"
            value={nameHi}
            onChange={(e) => setNameHi(e.target.value)}
            className="border px-3 py-1 rounded w-full"
          />
          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded col-span-2"
          >
            ➕ Add Category / श्रेणी जोड़ें
          </button>
        </div>

        <ul className="space-y-2">
          {(categories || []).length === 0 && (
            <li className="text-gray-500">No categories found.</li>
          )}
          {(categories || []).map((cat) => (
            <li
              key={cat.id}
              className="flex justify-between items-center border-b pb-2"
            >
              <span>
                🏷️ {cat.name_en} / {cat.name_hi}
              </span>
              <button
                className="text-red-600"
                onClick={() => handleDelete(cat.id)}
              >
                ❌ Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </DashboardLayout>
  );
}

export default withRoleGuard(ManageCategories, "admin");
