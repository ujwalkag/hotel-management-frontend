// components/layouts/StaffLayout.js
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function StaffLayout({ children }) {
  const { logout, auth } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-green-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Staff Panel</h1>
        <div>
          <span className="mr-4">Welcome, {auth.email}</span>
          <button
            onClick={logout}
            className="bg-red-600 px-3 py-1 rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </header>

      <nav className="bg-white shadow px-4 py-2 flex gap-4">
        <Link href="/staff/room-billing">Room Billing</Link>
        <Link href="/staff/restaurant-billing">Restaurant Billing</Link>
        <Link href="/services">Services</Link>
      </nav>

      <main className="p-4">{children}</main>
    </div>
  );
}

