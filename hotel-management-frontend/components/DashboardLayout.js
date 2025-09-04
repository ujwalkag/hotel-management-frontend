// components/DashboardLayout.js
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { useLanguage } from "@/context/LanguageContext"; // ✅ import language context

export default function DashboardLayout({ children }) {
  const { logout } = useAuth();
  const { language, toggleLanguage } = useLanguage(); // ✅ use language hook
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">
          🏨 {language === "hi" ? "होटल प्रबंधन प्रणाली" : "Hotel Management System"}
        </h1>
        <div className="flex gap-3 items-center">
          <button
            onClick={toggleLanguage}
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            {language === "hi" ? "English" : "हिन्दी"}
          </button>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
          >
            {language === "hi" ? "लॉगआउट" : "Logout"}
          </button>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}

