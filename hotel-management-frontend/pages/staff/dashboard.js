import { useAuth } from "@/context/AuthContext";
import withRoleGuard from "@/hoc/withRoleGuard";
import { useRouter } from "next/router";

function StaffDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Welcome, {user?.email}</h1>

      <div className="grid gap-4">
        <button
          className="bg-green-600 text-white p-3 rounded"
          onClick={() => router.push("/staff/room-billing")}
        >
          ➕ Create Room Bill
        </button>

        <button
          className="bg-blue-500 text-white p-3 rounded"
          onClick={() => router.push("/staff/bill-history")}
        >
          📜 View Bill History
        </button>

        <button
          className="bg-red-600 text-white p-3 rounded"
          onClick={logout}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
}

export default withRoleGuard(StaffDashboard, "staff");

