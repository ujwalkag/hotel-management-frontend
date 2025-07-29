import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import withRoleGuard from "@/hoc/withRoleGuard";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/DashboardLayout";

function ManageRooms() {
  const { user } = useAuth();
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

  const fetchRooms = async () => {
    try {
      const res = await fetch("/api/rooms/", {
        headers: {
          Authorization: `Bearer ${user?.access}`,
        },
      });
      const data = await res.json();
      setRooms(data);
    } catch {
      toast.error("Failed to fetch rooms");
    }
  };

  useEffect(() => {
    if (user?.access) fetchRooms();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updated = editingRoom ? { ...editingRoom, [name]: value } : { ...newRoom, [name]: value };
    editingRoom ? setEditingRoom(updated) : setNewRoom(updated);
  };

  const handleSave = async () => {
    const room = editingRoom || newRoom;
    const method = editingRoom ? "PUT" : "POST";
    const url = editingRoom ? `/api/rooms/${editingRoom.id}/` : "/api/rooms/";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user?.access}`,
      },
      body: JSON.stringify({
        ...room,
        price_per_day: parseFloat(room.price_per_day),
        price_per_hour: parseFloat(room.price_per_hour),
      }),
    });

    if (res.ok) {
      toast.success(editingRoom ? "Room updated" : "Room added");
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
      toast.error("Error saving room");
    }
  };

  const handleDelete = async (id) => {
    const res = await fetch(`/api/rooms/${id}/`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${user?.access}`,
      },
    });

    if (res.ok) {
      toast.success("Room deleted");
      fetchRooms();
    } else {
      toast.error("Error deleting room");
    }
  };

  const activeRoom = editingRoom || newRoom;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">🏨 Manage Rooms (कमरों का प्रबंधन)</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <input
            name="type_en"
            placeholder="Room Type (English)"
            value={activeRoom.type_en}
            onChange={handleInputChange}
            className="border p-2 rounded"
          />
          <input
            name="type_hi"
            placeholder="कमरे का प्रकार (Hindi)"
            value={activeRoom.type_hi}
            onChange={handleInputChange}
            className="border p-2 rounded"
          />
          <input
            name="price_per_day"
            type="number"
            placeholder="Price Per Day (प्रति दिन मूल्य)"
            value={activeRoom.price_per_day}
            onChange={handleInputChange}
            className="border p-2 rounded"
          />
          <input
            name="price_per_hour"
            type="number"
            placeholder="Price Per Hour (प्रति घंटा मूल्य)"
            value={activeRoom.price_per_hour}
            onChange={handleInputChange}
            className="border p-2 rounded"
          />
          <input
            name="description_en"
            placeholder="Description (English)"
            value={activeRoom.description_en}
            onChange={handleInputChange}
            className="border p-2 rounded"
          />
          <input
            name="description_hi"
            placeholder="विवरण (Hindi)"
            value={activeRoom.description_hi}
            onChange={handleInputChange}
            className="border p-2 rounded"
          />
        </div>

        <div className="mb-6">
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {editingRoom ? "Update Room (कमरा अपडेट करें)" : "Add Room (कमरा जोड़ें)"}
          </button>
        </div>

        <ul className="space-y-4">
          {rooms.map((room) => (
            <li key={room.id} className="border p-4 rounded shadow flex justify-between">
              <div>
                <p className="font-semibold">
                  {room.type_en} ({room.type_hi})
                </p>
                <p className="text-sm">₹{room.price_per_day}/day | ₹{room.price_per_hour}/hour</p>
                <p className="text-xs text-gray-600">
                  {room.description_en} ({room.description_hi})
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingRoom(room)}
                  className="text-blue-600"
                >
                  Edit (संपादित करें)
                </button>
                <button
                  onClick={() => handleDelete(room.id)}
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

export default withRoleGuard(ManageRooms, "admin");

