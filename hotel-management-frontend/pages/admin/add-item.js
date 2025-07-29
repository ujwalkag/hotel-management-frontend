// pages/admin/add-item.js
import { useState } from "react";
import withRoleGuard from "@/hoc/withRoleGuard";
import { useRouter } from "next/router";

function AddItemPage() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("main");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/menu/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, price, category }),
      });

      if (!res.ok) throw new Error("Create failed");

      setSuccess("Item created successfully");
      setName("");
      setPrice("");
      setCategory("main");
      setError("");
    } catch (err) {
      setError("Failed to add item");
      setSuccess("");
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-4 bg-white shadow rounded">
      <h1 className="text-xl font-bold mb-4">Add New Menu Item</h1>

      {success && <p className="text-green-600">{success}</p>}
      {error && <p className="text-red-600">{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          className="w-full mb-3 p-2 border rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Item name"
          required
        />
        <input
          className="w-full mb-3 p-2 border rounded"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price"
          required
        />
        <select
          className="w-full mb-4 p-2 border rounded"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="main">Main</option>
          <option value="snack">Snack</option>
          <option value="beverage">Beverage</option>
        </select>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 rounded"
        >
          Add Item
        </button>
      </form>
    </div>
  );
}

export default withRoleGuard(AddItemPage, ["admin"]);

