// pages/admin/manage-menu.js
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import withRoleGuard from "@/hoc/withRoleGuard";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/DashboardLayout";
import axios from "../../utils/axiosInstance";
function ManageMenu() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [newItem, setNewItem] = useState({ 
    name_en: "", name_hi: "", price: "", category_id: "" 
  });
  const [editingItem, setEditingItem] = useState(null);

  const fetchMenu = async () => {
    try {
      const showAllParam = showAll ? '?show_all=true' : '';
      const res = await fetch(`/api/menu/items/${showAllParam}`, {
        headers: { Authorization: `Bearer ${user?.access}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMenu(Array.isArray(data) ? data : data.results || []);
      } else {
        toast.error(language === "hi" ? "मेनू लोड करने में विफल" : "Failed to load menu");
      }
    } catch (error) {
      console.error('Error fetching menu:', error);
      toast.error(language === "hi" ? "मेनू लोड करने में त्रुटि" : "Error loading menu");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/menu/categories/", {
        headers: { Authorization: `Bearer ${user?.access}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : data.results || []);
      } else {
        toast.error(language === "hi" ? "श्रेणियाँ लोड करने में विफल" : "Failed to load categories");
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Enhanced delete function with better UX
  const handleDelete = async (id, itemName) => {
    const confirmMessage = language === "hi" 
      ? `क्या आप वाकई "${itemName}" को डिलीट करना चाहते हैं?\n\nनोट: यदि इस आइटम के पुराने ऑर्डर हैं तो यह केवल बंद हो जाएगा।`
      : `Are you sure you want to delete "${itemName}"?\n\nNote: If this item has order history, it will be discontinued instead of deleted.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setDeleting(id);
    try {
      const res = await fetch(`/api/menu/items/${id}/`, {
        method: "DELETE",
        headers: { 
          Authorization: `Bearer ${user?.access}`,
          'Content-Type': 'application/json'
        },
      });

      if (res.ok) {
        const data = await res.json();
        
        if (data.type === 'soft_delete') {
          toast.success(
            language === "hi" 
              ? `${itemName} को बंद कर दिया गया (पुराने ऑर्डर के कारण)` 
              : `${itemName} discontinued (due to order history)`,
            { 
              duration: 5000,
              icon: '⚠️'
            }
          );
        } else {
          toast.success(
            language === "hi" ? `${itemName} सफलतापूर्वक डिलीट किया गया` : `${itemName} deleted successfully`,
            { icon: '🗑️' }
          );
        }
        
        fetchMenu(); // Refresh the list
      } else {
        const errorData = await res.json();
        toast.error(errorData.detail || errorData.error || "Failed to delete item");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(
        language === "hi" ? "डिलीट करने में त्रुटि" : "Error deleting item"
      );
    } finally {
      setDeleting(null);
    }
  };

  // Reactivate discontinued item
  const handleReactivate = async (id, itemName) => {
    if (!confirm(
      language === "hi" 
        ? `क्या आप "${itemName}" को फिर से सक्रिय करना चाहते हैं?`
        : `Do you want to reactivate "${itemName}"?`
    )) {
      return;
    }

    try {
      const res = await fetch(`/api/menu/items/${id}/reactivate/`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${user?.access}`,
          'Content-Type': 'application/json'
        },
      });

      if (res.ok) {
        toast.success(
          language === "hi" ? `${itemName} फिर से सक्रिय किया गया` : `${itemName} reactivated`
        );
        fetchMenu();
      } else {
        const errorData = await res.json();
        toast.error(errorData.detail || "Failed to reactivate item");
      }
    } catch (error) {
      console.error("Reactivate error:", error);
      toast.error("Error reactivating item");
    }
  };

  const handleCreateOrUpdate = async () => {
    const item = editingItem || newItem;
    const method = editingItem ? "PUT" : "POST";
    const url = editingItem ? `/api/menu/items/${editingItem.id}/` : "/api/menu/items/";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.access}`,
        },
        body: JSON.stringify({ ...item, price: Number(item.price) }),
      });

      if (res.ok) {
        toast.success(editingItem 
          ? (language === "hi" ? "अपडेट किया गया" : "Updated") 
          : (language === "hi" ? "जोड़ा गया" : "Added")
        );
        setEditingItem(null);
        setNewItem({ name_en: "", name_hi: "", price: "", category_id: "" });
        fetchMenu();
      } else {
        toast.error(language === "hi" ? "सेव करने में विफल" : "Failed to save item");
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error(language === "hi" ? "सेव करने में त्रुटि" : "Error saving item");
    }
  };

  useEffect(() => {
    if (user?.access) {
      fetchMenu();
      fetchCategories();
    }
  }, [user, showAll]);

  const getItemName = (item) => {
    if (language === "hi") {
      return item.name_hi || item.name_en || "नाम उपलब्ध नहीं";
    }
    return item.name_en || item.name || "Name not available";
  };

  const activeItem = editingItem || newItem;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {language === "hi" ? "📋 मेनू प्रबंधन" : "📋 Manage Menu"}
          </h1>
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showAll}
                onChange={(e) => setShowAll(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">
                {language === "hi" ? "बंद आइटम भी दिखाएं" : "Show discontinued items"}
              </span>
            </label>
            
            <button
              onClick={fetchMenu}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              🔄 {language === "hi" ? "रिफ्रेश" : "Refresh"}
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingItem 
              ? (language === "hi" ? "आइटम संपादित करें" : "Edit Item")
              : (language === "hi" ? "नया आइटम जोड़ें" : "Add New Item")
            }
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder={language === "hi" ? "नाम (English)" : "Name (English)"}
              value={activeItem.name_en}
              onChange={(e) =>
                editingItem
                  ? setEditingItem({ ...editingItem, name_en: e.target.value })
                  : setNewItem({ ...newItem, name_en: e.target.value })
              }
              className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            
            <input
              type="text"
              placeholder={language === "hi" ? "नाम (हिंदी)" : "नाम (Hindi)"}
              value={activeItem.name_hi}
              onChange={(e) =>
                editingItem
                  ? setEditingItem({ ...editingItem, name_hi: e.target.value })
                  : setNewItem({ ...newItem, name_hi: e.target.value })
              }
              className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
              dir="auto"
            />
            
            <input
              type="number"
              placeholder={language === "hi" ? "कीमत" : "Price"}
              value={activeItem.price}
              onChange={(e) =>
                editingItem
                  ? setEditingItem({ ...editingItem, price: e.target.value })
                  : setNewItem({ ...newItem, price: e.target.value })
              }
              className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            
            <select
              value={activeItem.category_id}
              onChange={(e) =>
                editingItem
                  ? setEditingItem({ ...editingItem, category_id: e.target.value })
                  : setNewItem({ ...newItem, category_id: e.target.value })
              }
              className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">
                {language === "hi" ? "श्रेणी चुनें" : "Select Category"}
              </option>
              {(categories || []).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {language === "hi" ? (cat.name_hi || cat.name_en) : (cat.name_en || cat.name_hi)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mt-4 flex space-x-4">
            <button
              onClick={handleCreateOrUpdate}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
            >
              {editingItem 
                ? (language === "hi" ? "अपडेट करें" : "Update")
                : (language === "hi" ? "जोड़ें" : "Add")
              }
            </button>
            
            {editingItem && (
              <button
                onClick={() => {
                  setEditingItem(null);
                  setNewItem({ name_en: "", name_hi: "", price: "", category_id: "" });
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
              >
                {language === "hi" ? "रद्द करें" : "Cancel"}
              </button>
            )}
          </div>
        </div>

        {/* Menu Items Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold">
              {language === "hi" ? "मेनू आइटम" : "Menu Items"} ({menu.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">
                    {language === "hi" ? "#" : "#"}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">
                    {language === "hi" ? "आइटम नाम" : "Item Name"}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">
                    {language === "hi" ? "कीमत" : "Price"}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">
                    {language === "hi" ? "श्रेणी" : "Category"}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">
                    {language === "hi" ? "स्थिति" : "Status"}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">
                    {language === "hi" ? "क्रियाएं" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {menu.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900" dir="auto">
                          {getItemName(item)}
                        </div>
                        {item.name_hi && item.name_en && (
                          <div className="text-xs text-gray-500" dir="auto">
                            {language === "hi" ? item.name_en : item.name_hi}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-green-600">
                      ₹{item.price}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900" dir="auto">
                      {item.category 
                        ? (language === "hi" 
                            ? (item.category.name_hi || item.category.name_en)
                            : (item.category.name_en || item.category.name_hi)
                          )
                        : (language === "hi" ? "अवर्गीकृत" : "Uncategorized")
                      }
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        item.is_discontinued
                          ? 'bg-red-100 text-red-800'
                          : item.is_active && item.available
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.is_discontinued
                          ? (language === "hi" ? "बंद" : "Discontinued")
                          : item.is_active && item.available
                          ? (language === "hi" ? "सक्रिय" : "Active")
                          : (language === "hi" ? "निष्क्रिय" : "Inactive")
                        }
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          {language === "hi" ? "संपादित" : "Edit"}
                        </button>
                        
                        {item.is_discontinued ? (
                          <button
                            onClick={() => handleReactivate(item.id, getItemName(item))}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            {language === "hi" ? "सक्रिय करें" : "Reactivate"}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDelete(item.id, getItemName(item))}
                            disabled={deleting === item.id}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {deleting === item.id 
                              ? (language === "hi" ? "प्रक्रिया..." : "Processing...") 
                              : (language === "hi" ? "डिलीट" : "Delete")
                            }
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {menu.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🍽️</div>
                <h3 className="text-xl font-semibold mb-2">
                  {language === "hi" ? "कोई मेनू आइटम नहीं मिला" : "No menu items found"}
                </h3>
                <p className="text-gray-600">
                  {language === "hi" 
                    ? "कृपया पहले कुछ मेनू आइटम जोड़ें" 
                    : "Please add some menu items first"
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withRoleGuard(ManageMenu, "admin");

