import Link from "next/link";

const Sidebar = () => {
  return (
    <div className="w-64 h-screen bg-blue-900 text-white p-5">
      <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>
      <ul>
        <li className="mb-4">
          <Link href="/dashboard">Dashboard</Link>
        </li>
        <li className="mb-4">
          <Link href="/menu-management">Menu Management</Link>
        </li>
        <li className="mb-4">
          <Link href="/order-history">Order History</Link>
        </li>
        <li>
          <Link href="/notifications">Notifications</Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;

