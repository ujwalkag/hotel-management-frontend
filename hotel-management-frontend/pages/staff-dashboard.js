import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";

export default function StaffDashboard() {
  const { auth, logout } = useAuth();
  const { token, role, email } = auth || {};
  const router = useRouter();

  useEffect(() => {
    if (!token || role !== "employee") {
      router.push("/login");
    }
  }, [token, role]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-700">
          Welcome, {email || "Staff"}
        </h1>
        <button
          onClick={logout}
          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      <div className="grid gap-4">
        <FeatureCard title="Room Billing" link="/staff/room-billing" />
        <FeatureCard title="Restaurant Billing" link="/staff/restaurant-billing" />
        <FeatureCard title="Services" link="/services" />
      </div>
    </div>
  );
}

const FeatureCard = ({ title, link }) => (
  <div
    onClick={() => (window.location.href = link)}
    className="bg-white p-4 rounded-xl shadow cursor-pointer hover:bg-indigo-50"
  >
    <h3 className="text-lg font-medium text-gray-800">{title}</h3>
  </div>
);

