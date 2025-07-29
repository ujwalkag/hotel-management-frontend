// pages/admin/rooms.js
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import withRoleGuard from "@/hoc/withRoleGuard";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/DashboardLayout";

function ManageRooms() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState({
    type: "",
    price_per_day: "",
    price_per_hour: "",
    description: ""
  });
  const [editingRoom, setEditingRoom] = useState(null);

  const fetchRooms = async () => {
    try {
      const res = await fetch("/api/rooms/", {
        headers: {
          Authorization: `Bearer ${user?.access}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setRooms(data);
      } else {
        toast.error("Failed to fetch rooms");
      }
    } catch (err) {
      toast.error("Error fetching rooms");
    }
  };

  useEffect(() => {
    if (user?.access) fetchRooms();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingRoom) {
      setEditingRoom({ ...editingRoom, [name]: value });
    } else {
      setNewRoom({ ...newRoom, [name]: value });
    }
  };

  const handleSave = async () => {
    const payload = editingRoom || newRoom;

    const res = await fetch(`/api/rooms/${editingRoom ? editingRoom.id + "/" : ""}`, {
      method: editingRoom ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user?.access}`,
      },
      body: JSON.stringify({
        ...payload,
        price_per_day: parseFloat(payload.price_per_day),
        price_per_hour: parseFloat(payload.price_per_hour),
      }),
    });

    if (res.ok) {
      toast.success(editingRoom ? "Room updated" : "Room added");
      setNewRoom({ type: "", price_per_day: "", price_per_hour: "", description: "" });
      setEditingRoom(null);
      fetchRooms();
    } else {
      toast.error("Failed to save room");
    }
  };

  const handleDelete = async (id) => {
    try {
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
        toast.error("Failed to delete room");
      }
    } catch {
      toast.error("Error deleting room");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">🏨 Manage Rooms</h1>

        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 mb-4">
          <input
            name="type"
            placeholder="Room Type"
            value={editingRoom ? editingRoom.type : newRoom.type}
            onChange={handleInputChange}
            className="border px-2 py-1 rounded"
          />
          <input
            name="price_per_day"
            placeholder="Price/Day"
            type="number"
            value={editingRoom ? editingRoom.price_per_day : newRoom.price_per_day}
            onChange={handleInputChange}
            className="border px-2 py-1 rounded"
          />
          <input
            name="price_per_hour"
            placeholder="Price/Hour"
            type="number"
            value={editingRoom ? editingRoom.price_per_hour : newRoom.price_per_hour}
            onChange={handleInputChange}
            className="border px-2 py-1 rounded"
          />
          <input
            name="description"
            placeholder="Description"
            value={editingRoom ? editingRoom.description : newRoom.description}
            onChange={handleInputChange}
            className="border px-2 py-1 rounded col-span-1 sm:col-span-2"
          />
        </div>

        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-2 rounded mb-6"
        >
          {editingRoom ? "Update Room" : "Add Room"}
        </button>

        <ul className="space-y-2">
          {rooms.map((room) => (
            <li
              key={room.id}
              className="flex justify-between items-center border-b pb-2"
            >
              <div>
                <p className="font-semibold">{room.type}</p>
                <p className="text-sm text-gray-600">₹ {room.price_per_day}/day | ₹ {room.price_per_hour}/hr</p>
                <p className="text-xs text-gray-400">{room.description}</p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => setEditingRoom(room)}
                  className="text-blue-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(room.id)}
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

export default withRoleGuard(ManageRooms, "admin");

