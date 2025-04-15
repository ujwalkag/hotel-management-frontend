import { useEffect, useState } from "react";
import axios from "axios";

export default function RoomBilling() {
  const [guests, setGuests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState({
    guest: "",
    room: "",
    check_in: "",
    check_out: "",
  });
  const [duration, setDuration] = useState(0);
  const [message, setMessage] = useState("");

  // Fetch guests and rooms on mount
  useEffect(() => {
    axios.get("/api/guests/")
      .then(res => setGuests(res.data))
      .catch(err => console.error("Error fetching guests", err));

    axios.get("/api/rooms/")
      .then(res => setRooms(res.data))
      .catch(err => console.error("Error fetching rooms", err));
  }, []);

  // Calculate duration
  useEffect(() => {
    const { check_in, check_out } = formData;
    if (check_in && check_out) {
      const inDate = new Date(check_in);
      const outDate = new Date(check_out);
      const diff = Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24));
      setDuration(diff > 0 ? diff : 0);
    }
  }, [formData.check_in, formData.check_out]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await axios.post("/api/room-billing/", formData);
      setMessage("Room bill generated successfully.");
      setFormData({ guest: "", room: "", check_in: "", check_out: "" });
      setDuration(0);
    } catch (err) {
      console.error("Billing error", err);
      setMessage("Error generating bill. Please check details.");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Generate Room Bill</h2>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 shadow rounded">
        <div>
          <label className="block font-medium">Guest</label>
          <select name="guest" value={formData.guest} onChange={handleChange} required className="w-full border p-2 rounded">
            <option value="">Select Guest</option>
            {guests.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium">Room</label>
          <select name="room" value={formData.room} onChange={handleChange} required className="w-full border p-2 rounded">
            <option value="">Select Room</option>
            {rooms.map(r => (
              <option key={r.id} value={r.id}>{r.room_number}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block font-medium">Check-in</label>
            <input type="date" name="check_in" value={formData.check_in} onChange={handleChange} required className="w-full border p-2 rounded" />
          </div>
          <div className="flex-1">
            <label className="block font-medium">Check-out</label>
            <input type="date" name="check_out" value={formData.check_out} onChange={handleChange} required className="w-full border p-2 rounded" />
          </div>
        </div>

        {duration > 0 && (
          <p className="text-green-700">Stay Duration: {duration} day(s)</p>
        )}

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Generate Bill
        </button>

        {message && <p className="mt-2 text-center text-sm text-gray-700">{message}</p>}
      </form>
    </div>
  );
}

