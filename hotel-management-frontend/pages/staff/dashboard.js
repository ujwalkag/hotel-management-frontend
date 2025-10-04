// pages/staff/dashboard.js - COMPLETE REPLACEMENT
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import withRoleGuard from "@/hoc/withRoleGuard";
import Link from "next/link";
import { StaffAdvanceBookingWidget } from '@/components/AdvanceBookingWidgets';
import { useLanguage } from "@/context/LanguageContext";

function StaffDashboard() {
  const { user, logout } = useAuth();
  const { language } = useLanguage();
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header with Hindi Support */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg mb-8 shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                👨‍💼 {language === "hi" ? "स्टाफ डैशबोर्ड" : "Staff Dashboard"}
              </h1>
              <p className="text-blue-100">
                {language === "hi" 
                  ? "होटल प्रबंधन और बिलिंग सिस्टम" 
                  : "Hotel Management & Billing System"
                }
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-blue-100">
                  {language === "hi" ? "स्वागत है," : "Welcome,"}
                </p>
                <p className="font-semibold">
                  {user?.first_name || user?.email?.split('@')[0] || 'Staff'}
                </p>
              </div>
              <button 
                onClick={logout} 
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {language === "hi" ? "लॉगआउट" : "Logout"}
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Summary Stats with Hindi Labels */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard 
              label={language === "hi" ? "आज की कमाई" : "Today's Revenue"}
              value={summary.today_total || summary.total_today}
              icon="💰"
              color="green"
            />
            <StatCard 
              label={language === "hi" ? "इस महीने की कमाई" : "This Month's Revenue"}
              value={summary.month_total}
              icon="📊"
              color="blue"
            />
            <StatCard 
              label={language === "hi" ? "कुल बिल" : "Total Bills"}
              value={summary.total_bills}
              icon="🧾"
              color="purple"
              isCount={true}
            />
            <StatCard 
              label={language === "hi" ? "औसत बिल" : "Average Bill"}
              value={summary.average_bill}
              icon="📈"
              color="orange"
            />
          </div>
        )}

        {/* Enhanced Quick Actions Grid with Hindi Labels */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <LinkCard
            href="/staff/restaurant-billing"
            label={language === "hi" ? "रेस्टोरेंट बिलिंग" : "Restaurant Billing"}
            description={language === "hi" ? "रेस्टोरेंट के ऑर्डर का बिल बनाएं" : "Generate bills for restaurant orders"}
            icon="🍽️"
            color="green"
          />
          
          <LinkCard
            href="/staff/room-billing"
            label={language === "hi" ? "रूम बिलिंग" : "Room Billing"}
            description={language === "hi" ? "होटल रूम का बिल बनाएं" : "Generate bills for hotel rooms"}
            icon="🏨"
            color="blue"
          />
          
          <LinkCard
            href="/staff/bill-history"
            label={language === "hi" ? "बिल इतिहास" : "Bill History"}
            description={language === "hi" ? "पिछले बिल देखें और प्रिंट करें" : "View and print previous bills"}
            icon="📊"
            color="purple"
          />
          
          <LinkCard
            href="/admin/mobile-ordering"
            label={language === "hi" ? "मोबाइल ऑर्डरिंग" : "Mobile Ordering"}
            description={language === "hi" ? "मोबाइल ऑर्डर प्रबंधित करें" : "Manage mobile orders"}
            icon="📱"
            color="indigo"
          />
          
          <LinkCard
            href="/admin/table-management"
            label={language === "hi" ? "टेबल प्रबंधन" : "Table Management"}
            description={language === "hi" ? "टेबल स्थिति और ऑर्डर देखें" : "View table status and orders"}
            icon="🪑"
            color="teal"
          />
          
          <LinkCard
            href="/admin/kitchen-display"
            label={language === "hi" ? "किचन डिस्प्ले" : "Kitchen Display"}
            description={language === "hi" ? "किचन ऑर्डर स्क्रीन देखें" : "View kitchen order screen"}
            icon="👨‍🍳"
            color="orange"
          />
        </div>

        {/* Enhanced Recent Activity Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            📋 {language === "hi" ? "हाल की गतिविधि" : "Recent Activity"}
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  💰
                </div>
                <div>
                  <p className="font-medium">
                    {language === "hi" ? "नया बिल जेनरेट किया गया" : "New bill generated"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {language === "hi" ? "2 मिनट पहले" : "2 minutes ago"}
                  </p>
                </div>
              </div>
              <span className="text-green-600 font-semibold">₹1,250</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  🏨
                </div>
                <div>
                  <p className="font-medium">
                    {language === "hi" ? "रूम चेकआउट पूरा" : "Room checkout completed"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {language === "hi" ? "15 मिनट पहले" : "15 minutes ago"}
                  </p>
                </div>
              </div>
              <span className="text-blue-600 font-semibold">₹3,500</span>
            </div>
          </div>
        </div>

        {/* Enhanced Advance Booking Widget */}
        <div className="mt-8">
          <StaffAdvanceBookingWidget />
        </div>
      </div>
    </div>
  );
}

// ENHANCED StatCard COMPONENT WITH HINDI SUPPORT:
function StatCard({ label, value, icon, color = 'blue', isCount = false }) {
  const colorClasses = {
    green: 'bg-green-50 text-green-600 border-green-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200'
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm border-2 ${colorClasses[color]} hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
          <p className="text-2xl font-bold">
            {isCount ? value : `₹ ${value?.toLocaleString("en-IN") || "0"}`}
          </p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
}

// ENHANCED LinkCard COMPONENT WITH HINDI SUPPORT:
function LinkCard({ href, label, description, icon, color = 'blue' }) {
  const colorClasses = {
    green: 'hover:bg-green-50 border-green-200 hover:border-green-300 text-green-600',
    blue: 'hover:bg-blue-50 border-blue-200 hover:border-blue-300 text-blue-600',
    purple: 'hover:bg-purple-50 border-purple-200 hover:border-purple-300 text-purple-600',
    indigo: 'hover:bg-indigo-50 border-indigo-200 hover:border-indigo-300 text-indigo-600',
    teal: 'hover:bg-teal-50 border-teal-200 hover:border-teal-300 text-teal-600',
    orange: 'hover:bg-orange-50 border-orange-200 hover:border-orange-300 text-orange-600'
  };

  return (
    <Link href={href}>
      <div className={`bg-white p-6 rounded-lg shadow-sm border-2 ${colorClasses[color]} hover:shadow-md transition-all cursor-pointer transform hover:scale-105`}>
        <div className="flex items-start space-x-4">
          <div className="text-3xl">{icon}</div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">{label}</h3>
            <p className="text-gray-600 text-sm">{description}</p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <div className="text-sm font-medium opacity-70">→</div>
        </div>
      </div>
    </Link>
  );
}

export default withRoleGuard(StaffDashboard, ["staff"]);

