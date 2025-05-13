import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import withRoleGuard from "@/hoc/withRoleGuard";
import toast from "react-hot-toast";

function RoomBillingPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [daysStayed, setDaysStayed] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch("/api/rooms/");
        const data = await res.json();
        setRooms(data);
      } catch (err) {
        toast.error("Failed to fetch rooms");
      }
    };
    fetchRooms();
  }, []);

  const handleBilling = async () => {
    if (!selectedRoom || daysStayed <= 0) {
      toast.error("Select a room and valid number of days");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/bills/create/room/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.access}`,
        },
        body: JSON.stringify({
          room: selectedRoom,
          days: daysStayed,
        }),
      });

      if (!res.ok) throw new Error("Failed to create bill");
      const data = await res.json();
      toast.success("Room bill created successfully!");
      console.log("✅ Bill created:", data);
    } catch (err) {
      toast.error("Error creating room bill");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Create Room Bill</h1>

      <select
        value={selectedRoom || ""}
        onChange={(e) => setSelectedRoom(e.target.value)}
        className="border p-2 mb-4 w-full"
      >
        <option value="" disabled>Select Room</option>
        {rooms.map((room) => (
          <option key={room.id} value={room.id}>
            {room.name} - ₹{room.price}/day
          </option>
        ))}
      </select>

      <input
        type="number"
        min={1}
        value={daysStayed}
        onChange={(e) => setDaysStayed(parseInt(e.target.value))}
        className="border p-2 mb-4 w-full"
        placeholder="Number of days"
      />

      <button
        onClick={handleBilling}
        className="bg-blue-600 text-white p-2 rounded w-full disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Processing..." : "Generate Bill"}
      </button>
    </div>
  );
}

export default withRoleGuard(RoomBillingPage, "staff");

