import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import withRoleGuard from "@/hoc/withRoleGuard";
import Link from "next/link";

function EmployeeDetail() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user?.access) {
      fetchEmployeeDetails();
    }
  }, [id, user]);

  const fetchEmployeeDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/users/staff/${id}/`, {
        headers: { Authorization: `Bearer ${user.access}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEmployee(data);
      } else {
        throw new Error('Failed to fetch employee');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to load employee details");
      router.push('/admin/employees');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center">Loading employee details...</div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center">Employee not found</div>
        <Link href="/admin/employees">
          <a className="text-blue-600">← Back to Employees</a>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Employee Details: {employee.username || employee.email}
        </h1>
        <div className="flex gap-4">
          <Link href="/admin/employees">
            <a className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
              ← Back to Employees
            </a>
          </Link>
          <Link href="/admin/dashboard">
            <a className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
              🏠 Home
            </a>
          </Link>
          <button
            onClick={logout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Employee Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <strong>Username:</strong> {employee.username || 'N/A'}
          </div>
          <div>
            <strong>Email:</strong> {employee.email}
          </div>
          <div>
            <strong>Role:</strong> 
            <span className={`ml-2 px-2 py-1 text-xs rounded ${
              employee.role === 'admin' ? 'bg-red-100 text-red-800' :
              employee.role === 'staff' ? 'bg-blue-100 text-blue-800' :
              'bg-green-100 text-green-800'
            }`}>
              {employee.role}
            </span>
          </div>
          <div>
            <strong>Status:</strong>
            <span className={`ml-2 px-2 py-1 text-xs rounded ${
              employee.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {employee.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div>
            <strong>Can Create Orders:</strong> {employee.can_create_orders ? '✅' : '❌'}
          </div>
          <div>
            <strong>Can Generate Bills:</strong> {employee.can_generate_bills ? '✅' : '❌'}
          </div>
          <div>
            <strong>Can Access Kitchen:</strong> {employee.can_access_kitchen ? '✅' : '❌'}
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <Link href={`/admin/employees?edit=${employee.id}`}>
            <a className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Edit Employee
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default withRoleGuard(EmployeeDetail, "admin");

