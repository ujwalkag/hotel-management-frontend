import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import WaiterLayout from '@/components/layouts/WaiterLayout';
import withRoleGuard from '@/hoc/withRoleGuard';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useLanguage } from "@/context/LanguageContext";
import {
    AdvanceBookingNotificationBanner,
    WaiterAdvanceBookingWidget
} from '@/components/AdvanceBookingWidgets';


function WaiterDashboard() {
    const { user, makeAuthenticatedRequest } = useAuth();
    const { language } = useLanguage();
    const [dashboardData, setDashboardData] = useState({
        myTables: [],
        todayOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalEarnings: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
        // Refresh every 30 seconds
        const interval = setInterval(loadDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [tablesRes, statsRes] = await Promise.all([
                makeAuthenticatedRequest('/api/restaurant/tables/with_orders/'),
                makeAuthenticatedRequest('/api/restaurant/dashboard-stats/')
            ]);

            if (tablesRes && tablesRes.ok) {
                const tablesData = await tablesRes.json();
                // Filter tables that have orders created by this waiter or are currently occupied
                // Safe parsing with fallbacks
                const tablesArray = tablesData?.tables || tablesData || [];
                const myTables = Array.isArray(tablesArray) ? tablesArray.filter(table =>
                    table?.status === 'occupied' ||
                    (table?.active_orders && Array.isArray(table.active_orders) &&
                        table.active_orders.some(order =>
                            order?.created_by_name === user?.get_full_name?.() ||
                            order?.created_by_name === user?.email
                        ))
                ) : [];
                ;

                setDashboardData(prev => ({
                    ...prev,
                    myTables: myTables
                }));
            }

            if (statsRes && statsRes.ok) {
                const statsData = await statsRes.json();
                setDashboardData(prev => ({
                    ...prev,
                    todayOrders: statsData.orders?.total_today || 0,
                    pendingOrders: statsData.orders?.pending || 0,
                    completedOrders: statsData.orders?.ready || 0
                }));
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (language === "hi") {
            if (hour < 12) return 'सुप्रभात';
            if (hour < 17) return 'नमस्कार';
            return 'शुभ संध्या';
        } else {
            if (hour < 12) return 'Good Morning';
            if (hour < 17) return 'Good Afternoon';
            return 'Good Evening';
        }
    };

    const getTableStatusIcon = (status) => {
        const icons = {
            free: '✅',
            occupied: '👥',
            reserved: '📅',
            cleaning: '🧹',
            maintenance: '🔧'
        };
        return icons[status] || '❓';
    };

    if (loading) {
        return (
            <WaiterLayout>
                <div className="flex items-center justify-center min-h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading your dashboard...</p>
                    </div>
                </div>
            </WaiterLayout>
        );
    }

    return (
        <WaiterLayout>
            <div className="space-y-6">
                {/* Welcome Header with HOME BUTTON */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-lg mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">
                                {getGreeting()}, {user?.first_name || user?.email?.split('@')[0] || 'Waiter'}! 👋
                            </h1>
                            <p className="text-purple-100">
                                {language === "hi"
                                    ? "उत्कृष्टता के साथ अतिथियों की सेवा के लिए तैयार"
                                    : "Ready to serve guests with excellence"
                                }
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Link
                                href="/waiter/dashboard"
                                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg flex items-center text-sm font-bold transition-all"
                            >
                                🏠 {language === "hi" ? "होम" : "HOME"}
                            </Link>
                            <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg flex items-center">
                                👨‍🍳
                            </div>
                        </div>
                    </div>
                </div>


                {/* Quick Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">
                                    {language === "hi" ? "मेरी टेबल" : "My Tables"}
                                </p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {dashboardData.myTables.length}
                                </p>
                            </div>
                            <div className="text-purple-500 text-2xl">🪑</div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">
                                    {language === "hi" ? "आज के ऑर्डर" : "Today's Orders"}
                                </p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {dashboardData.todayOrders}
                                </p>
                            </div>
                            <div className="text-blue-500 text-2xl">📝</div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">
                                    {language === "hi" ? "लंबित ऑर्डर" : "Pending Orders"}
                                </p>
                                <p className="text-2xl font-bold text-yellow-600">
                                    {dashboardData.pendingOrders}
                                </p>
                            </div>
                            <div className="text-yellow-500 text-2xl">⏳</div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">
                                    {language === "hi" ? "तैयार ऑर्डर" : "Ready Orders"}
                                </p>
                                <p className="text-2xl font-bold text-green-600">
                                    {dashboardData.completedOrders}
                                </p>
                            </div>
                            <div className="text-green-500 text-2xl">✅</div>
                        </div>
                    </div>
                </div>


                <div className="bg-white rounded-lg p-6 shadow-md border-l-4 border-green-500">
                    <div className="flex items-center">
                        <div className="text-2xl text-green-600 mr-4">📝</div>
                        <div>
                            <AdvanceBookingNotificationBanner />
                            <WaiterAdvanceBookingWidget />
                        </div>
                    </div>
                </div>



                {/* Quick Actions with HOME ACCESS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Link href="/waiter/dashboard">
                        <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
                            <div className="text-3xl mb-3">🏠</div>
                            <h3 className="font-semibold text-lg mb-2">
                                {language === "hi" ? "होम डैशबोर्ड" : "HOME Dashboard"}
                            </h3>
                            <p className="text-gray-600 text-sm">
                                {language === "hi" ? "मुख्य डैशबोर्ड पर वापस जाएं" : "Return to main dashboard"}
                            </p>
                        </div>
                    </Link>

                    <Link href="/waiter/take-orders">
                        <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
                            <div className="text-3xl mb-3">📝</div>
                            <h3 className="font-semibold text-lg mb-2">
                                {language === "hi" ? "नया ऑर्डर लें" : "Take New Order"}
                            </h3>
                            <p className="text-gray-600 text-sm">
                                {language === "hi" ? "अपनी टेबल के लिए ऑर्डर लेना शुरू करें" : "Start taking orders for your tables"}
                            </p>
                        </div>
                    </Link>

                    <Link href="/waiter/my-tables">
                        <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
                            <div className="text-3xl mb-3">🪑</div>
                            <h3 className="font-semibold text-lg mb-2">
                                {language === "hi" ? "मेरी टेबल देखें" : "View My Tables"}
                            </h3>
                            <p className="text-gray-600 text-sm">
                                {language === "hi" ? "अपनी असाइन की गई टेबल की स्थिति जांचें" : "Check status of your assigned tables"}
                            </p>
                        </div>
                    </Link>

                    <Link href="/waiter/order-status">
                        <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
                            <div className="text-3xl mb-3">📋</div>
                            <h3 className="font-semibold text-lg mb-2">
                                {language === "hi" ? "ऑर्डर स्थिति" : "Order Status"}
                            </h3>
                            <p className="text-gray-600 text-sm">
                                {language === "hi" ? "अपने ऑर्डर और अपडेट ट्रैक करें" : "Track your orders and updates"}
                            </p>
                        </div>
                    </Link>
                </div>


                {/* My Tables Overview with HOME NAVIGATION */}
                <div className="bg-white rounded-lg p-6 shadow-sm border">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">
                            {language === "hi" ? "मेरी टेबल का अवलोकन" : "My Tables Overview"}
                        </h2>
                        <div className="flex gap-2">
                            <Link
                                href="/waiter/dashboard"
                                className="text-purple-600 hover:text-purple-800 text-sm font-medium bg-purple-50 px-3 py-1 rounded-full"
                            >
                                🏠 {language === "hi" ? "होम" : "HOME"}
                            </Link>
                            <Link
                                href="/waiter/my-tables"
                                className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                            >
                                {language === "hi" ? "सभी देखें →" : "View All →"}
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dashboardData.myTables.length === 0 ? (
                            <div className="col-span-full text-center py-8">
                                <div className="text-4xl mb-4">🪑</div>
                                <h3 className="text-lg font-semibold mb-2">
                                    {language === "hi" ? "कोई टेबल असाइन नहीं" : "No Tables Assigned"}
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    {language === "hi"
                                        ? "वर्तमान में आपकी कोई टेबल असाइन या occupied नहीं है।"
                                        : "You don't have any tables currently assigned or occupied."
                                    }
                                </p>
                                <div className="flex justify-center gap-3">
                                    <Link
                                        href="/waiter/dashboard"
                                        className="inline-flex items-center px-4 py-2 border border-purple-300 text-sm font-medium rounded-md text-purple-700 bg-white hover:bg-purple-50"
                                    >
                                        🏠 {language === "hi" ? "होम" : "HOME"}
                                    </Link>
                                    <Link
                                        href="/waiter/take-orders"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                                    >
                                        {language === "hi" ? "ऑर्डर लेना शुरू करें" : "Start Taking Orders"}
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            dashboardData.myTables.slice(0, 6).map(table => (
                                <div key={table.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-semibold text-lg">
                                            {language === "hi" ? `टेबल ${table.table_number}` : `Table ${table.table_number}`}
                                        </h3>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${table.active_orders_count > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                            }`}>
                                            {getTableStatusIcon(table.status)} {
                                                language === "hi" ? (
                                                    table.status === 'free' ? 'मुक्त' :
                                                        table.status === 'occupied' ? 'व्यस्त' :
                                                            table.status === 'reserved' ? 'आरक्षित' :
                                                                table.status === 'cleaning' ? 'सफाई' :
                                                                    table.status === 'maintenance' ? 'रखरखाव' : table.status
                                                ) : table.status
                                            }
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-sm text-gray-600">
                                        <div className="flex justify-between">
                                            <span>{language === "hi" ? "क्षमता:" : "Capacity:"}</span>
                                            <span>{table.capacity} {language === "hi" ? "लोग" : "people"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>{language === "hi" ? "सक्रिय ऑर्डर:" : "Active Orders:"}</span>
                                            <span>{table.active_orders_count || 0}</span>
                                        </div>
                                        {table.total_bill_amount > 0 && (
                                            <div className="flex justify-between">
                                                <span>{language === "hi" ? "बिल राशि:" : "Bill Amount:"}</span>
                                                <span className="font-semibold">₹{table.total_bill_amount.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4">
                                        <Link
                                            href={`/waiter/take-orders?table=${table.id}`}
                                            className="w-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm text-center block transition-colors"
                                        >
                                            {language === "hi" ? "ऑर्डर जोड़ें" : "Add Order"}
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </WaiterLayout>
    );
}

export default withRoleGuard(WaiterDashboard, ['waiter']);
