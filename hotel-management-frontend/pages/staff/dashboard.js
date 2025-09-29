// pages/staff/dashboard.js
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import withRoleGuard from "@/hoc/withRoleGuard";
import Link from "next/link";
import { StaffAdvanceBookingWidget } from '@/components/AdvanceBookingWidgets';


function StaffDashboard() {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch("/api/bills/summary/", {
          headers: {
            Authorization: `Bearer ${user?.access}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setSummary(data);
        }
      } catch (err) {
        console.error("Failed to fetch summary", err);
      }
    };

    if (user?.access) fetchSummary();
  }, [user]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">👨‍💼 Staff Dashboard / स्टाफ डैशबोर्ड</h1>
        <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded">
          Logout / लॉगआउट
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <StatCard label="Today's Revenue / आज की कमाई" value={summary.total_today} />
              <StaffAdvanceBookingWidget />

        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <LinkCard href="/staff/room-billing" label="➕ Generate Room Bill / रूम बिल बनाएं" />
        <LinkCard href="/staff/bill-history" label="📜 View Bill History / बिल इतिहास" />
        <LinkCard href="/staff/restaurant-billing" label="🍽️ Generate Restaurant Bill / रेस्टोरेंट बिल बनाएं" />
        <LinkCard href="/admin/mobile-ordering" label="🍽️  Mobile Orders / रेस्टोरेंट बिल बनाएं" />
        <LinkCard href="/admin/table-management" label="🍽️  Table-management / रेस्टोरेंट बिल बनाएं" />
        <LinkCard href="/admin/kitchen-display" label="🍽️  kitchen-display / रेस्टोरेंट बिल बनाएं" />

        </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="p-4 bg-white border rounded-xl shadow text-center">
      <h2 className="text-lg font-semibold text-gray-600">{label}</h2>
      <p className="text-2xl font-bold text-green-600">₹ {value?.toLocaleString("en-IN")}</p>
    </div>
  );
}

function LinkCard({ href, label }) {
  return (
    <Link href={href} className="block p-4 bg-white border rounded-xl shadow hover:shadow-lg transition">
      <span className="text-lg font-medium text-gray-700">{label}</span>
    </Link>
  );
}

export default withRoleGuard(StaffDashboard, ["staff"]);


