export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="bg-white shadow p-4 font-semibold">Admin Panel</header>
      <main className="p-6">{children}</main>
    </div>
  );
}

