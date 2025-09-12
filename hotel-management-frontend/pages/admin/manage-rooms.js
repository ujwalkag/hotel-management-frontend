import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import withRoleGuard from "@/hoc/withRoleGuard";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/DashboardLayout";

function ManageRooms() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState({
    type_en: "",
    type_hi: "",
    price_per_day: "",
    price_per_hour: "",
    description_en: "",
    description_hi: "",
  });
  const [editingRoom, setEditingRoom] = useState(null);

  useEffect(() => {
    if (user?.access) fetchRooms();
  }, [user]);

  async function fetchRooms() {
    try {
      const res = await fetch("/api/rooms/types/", {
        headers: { Authorization: `Bearer ${user.access}` },
      });
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data.results || [];
      setRooms(arr);
    } catch {
      toast.error(
        language === "hi" ? "कमरे लोड नहीं हो पाए" : "Failed to fetch rooms"
      );
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    const updated = editingRoom
      ? { ...editingRoom, [name]: value }
      : { ...newRoom, [name]: value };
    editingRoom ? setEditingRoom(updated) : setNewRoom(updated);
  }

  async function handleSave() {
    const room = editingRoom || newRoom;
    const method = editingRoom ? "PUT" : "POST";
    const url = editingRoom
      ? `/api/rooms/types/${editingRoom.id}/`
      : `/api/rooms/types/`;

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.access}`,
      },
      body: JSON.stringify({
        ...room,
        price_per_day: parseFloat(room.price_per_day),
        price_per_hour: parseFloat(room.price_per_hour),
      }),
    });
    if (res.ok) {
      toast.success(
        language === "hi" ? "कमरा सहेजा गया" : editingRoom ? "Room updated" : "Room added"
      );
      setEditingRoom(null);
      setNewRoom({
        type_en: "",
        type_hi: "",
        price_per_day: "",
        price_per_hour: "",
        description_en: "",
        description_hi: "",
      });
      fetchRooms();
    } else {
      toast.error(language === "hi" ? "त्रुटि आई" : "Error saving");
    }
  }

  async function handleDelete(id) {
    const res = await fetch(`/api/rooms/types/${id}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${user.access}` },
    });
    if (res.ok) {
      toast.success(language === "hi" ? "कमरा हटाया गया" : "Room deleted");
      fetchRooms();
    } else {
      toast.error(language === "hi" ? "त्रुटि आई" : "Error deleting");
    }
  }

  const active = editingRoom || newRoom;
  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">
          {language === "hi" ? "🏨 कमरे प्रबंधन" : "🏨 Manage Rooms"}
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <input
            name="type_en"
            placeholder={language==="hi"?"कमरा प्रकार (Ang)":"Room Type (English)"}
            value={active.type_en}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            name="type_hi"
            placeholder={language==="hi"?"कमरा प्रकार (Hindi)":"Room Type (Hindi)"}
            value={active.type_hi}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            name="price_per_day"
            type="number"
            placeholder={language==="hi"?"मूल्य/दिन":"Price/Day"}
            value={active.price_per_day}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            name="price_per_hour"
            type="number"
            placeholder={language==="hi"?"मूल्य/घंटा":"Price/Hour"}
            value={active.price_per_hour}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            name="description_en"
            placeholder={language==="hi"?"विवरण (Ang)":"Description (English)"}
            value={active.description_en}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            name="description_hi"
            placeholder={language==="hi"?"विवरण (Hindi)":"Description (Hindi)"}
            value={active.description_hi}
            onChange={handleChange}
            className="border p-2 rounded"
          />
        </div>
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-2 rounded mb-6"
        >
          {editingRoom
            ? language==="hi"? "कमरा अपडेट करें":"Update Room"
            : language==="hi"? "कमरा जोड़ें":"Add Room"}
        </button>
        <ul className="space-y-4">
          {rooms.map((r) => (
            <li
              key={r.id}
              className="border p-4 rounded flex justify-between"
            >
              <div>
                <p className="font-semibold">
                  {r.type_en} ({r.type_hi})
                </p>
                <p className="text-sm">
                  ₹{r.price_per_day}/day | ₹{r.price_per_hour}/hr
                </p>
                <p className="text-xs text-gray-600">
                  {r.description_en} ({r.description_hi})
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingRoom(r)}
                  className="text-blue-600"
                >
                  {language==="hi"?"संपादित करें":"Edit"}
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="text-red-600"
                >
                  {language==="hi"?"हटाएं":"Delete"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </DashboardLayout>
  );
}

export default withRoleGuard(ManageRooms, "admin");

