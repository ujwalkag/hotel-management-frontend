// pages/admin/dashboard.js
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import withRoleGuard from "@/hoc/withRoleGuard";
import Link from "next/link";


function AdminDashboard() {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch("/api/bills/summary/", {
          headers: { Authorization: `Bearer ${user?.access}` },
        });
        const data = await res.json();
        setSummary(data);
      } catch (err) {
        console.error("Error loading summary");
      }
    };
    if (user?.access) fetchSummary();
  }, [user]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📊 Admin Dashboard / व्यवस्थापक डैशबोर्ड</h1>
        <button
          onClick={logout}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout / लॉगआउट
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Today / आज का कुल" value={summary.total_today} />
          <StatCard label="This Week / इस सप्ताह" value={summary.total_week} />
          <StatCard label="This Month / इस माह" value={summary.total_month} />
          <StatCard label="Total Bills / कुल बिल" value={summary.total_bills} />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <LinkCard href="/admin/restaurant-billing" label="🍽️ Restaurant Billing / रेस्टोरेंट बिलिंग" />
        <LinkCard href="/admin/manage-menu" label="📋 Manage Menu / मेनू प्रबंधन" />
        <LinkCard href="/admin/manage-categories" label="📂 Manage Categories / श्रेणी प्रबंधन" /> {/* ✅ Added */}
        <LinkCard href="/admin/manage-staff" label="👥 Manage Staff / स्टाफ प्रबंधन" />
        <LinkCard href="/admin/room-billing" label="🛏️ Room Billing / रूम बिलिंग" />
        <LinkCard href="/admin/manage-rooms" label="🏨 Manage Rooms / कमरा प्रबंधन" />
        <LinkCard href="/admin/bill-history" label="📜 View Bill History / बिल इतिहास देखें" />
        <LinkCard href="/admin/analytics" label="📊 Analytics Dashboard / विश्लेषण डैशबोर्ड" />
      </div>
         </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="p-4 bg-white border rounded-xl shadow text-center">
      <h2 className="text-lg font-semibold text-gray-600">{label}</h2>
      <p className="text-2xl font-bold text-blue-600">₹ {value?.toLocaleString("en-IN")}</p>
    </div>
  );
}

function LinkCard({ href, label }) {
  return (
    <Link
      href={href}
      className="block p-4 bg-white border rounded-xl shadow hover:shadow-lg transition"
    >
      <span className="text-lg font-medium text-gray-700">{label}</span>
    </Link>
  );
}

export default withRoleGuard(AdminDashboard, ["admin"]);
