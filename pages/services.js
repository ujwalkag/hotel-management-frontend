// hotel-management-frontend/pages/services.js

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";

export default function Services() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    if (!loading && (!user || !["admin", "employee"].includes(user.role))) {
      router.push("/login");
    }
  }, [loading, user]);

  const fetchServices = async () => {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const [roomRes, menuRes] = await Promise.all([
        fetch("/api/rooms/", { headers }),
        fetch("/api/menu/", { headers }),
      ]);

      if (!roomRes.ok || !menuRes.ok) {
        throw new Error("Failed to fetch services.");
      }

      const roomData = await roomRes.json();
      const menuData = await menuRes.json();

      setRooms(roomData);
      setMenuItems(menuData);
    } catch (err) {
      console.error("Service fetch error:", err);
    }
  };

  useEffect(() => {
    if (token) fetchServices();
  }, [token]);

  if (loading || !user) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Available Services</h1>

      {/* Rooms */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-indigo-700 mb-4">Available Rooms</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <div key={room.id} className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-semibold">{room.room_type}</h3>
              <p className="text-gray-600">Price: ₹{room.price_per_night}</p>
              <p className="text-sm text-green-600">
                {room.is_available ? "Available" : "Occupied"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Menu */}
      <div>
        <h2 className="text-xl font-semibold text-indigo-700 mb-4">Restaurant Menu</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {menuItems.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-semibold">{item.name}</h3>
              <p className="text-gray-600">Category: {item.category}</p>
              <p className="text-gray-800 font-bold">₹{item.price}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

