import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import withRoleGuard from "@/hoc/withRoleGuard";

function AdminRoomsPage() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", price: "", available: true });

  useEffect(() => {
    fetchServices();
  }, [user]);

  async function fetchServices() {
    const res = await fetch('/api/rooms/', {
      headers: { Authorization: `Bearer ${user.access}` }
    });
    const data = await res.json();
    setServices(data);
  }

  async function handleAdd() {
    const res = await fetch('/api/rooms/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.access}` },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      setForm({ name: "", description: "", price: "", available: true });
      fetchServices();
      alert("Room Service Added!");
    } else {
      alert("Failed to add service.");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this service?")) return;
    await fetch(`/api/rooms/${id}/`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user.access}` }
    });
    fetchServices();
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Room Services Management</h1>

      <div className="mb-8">
        <input
          className="border p-2 mr-2"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="border p-2 mr-2"
          placeholder="Price"
          type="number"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />
        <button onClick={handleAdd} className="bg-green-600 text-white p-2 rounded">
          Add Room Service
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map(service => (
          <div key={service.id} className="border p-4 flex justify-between items-center">
            <div>
              <p className="font-bold">{service.name}</p>
              <p className="text-gray-500">₹{service.price}</p>
            </div>
            <button onClick={() => handleDelete(service.id)} className="text-red-600">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default withRoleGuard(AdminRoomsPage, ['admin']);

