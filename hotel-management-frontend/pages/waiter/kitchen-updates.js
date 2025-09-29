import WaiterLayout from '@/components/layouts/WaiterLayout';
import withRoleGuard from '@/hoc/withRoleGuard';
import Link from 'next/link';

function KitchenUpdates() {
  return (
    <WaiterLayout>
      <div className="space-y-6">
        {/* Header with HOME BUTTON */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🍳 Kitchen Updates</h1>
              <p className="text-gray-600 mt-1">Real-time kitchen status updates</p>
            </div>
            <Link
              href="/waiter/dashboard"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold flex items-center animate-pulse"
            >
              🏠 HOME
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">🍳</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Kitchen Updates</h2>
            <p className="text-gray-600 mb-6">This page shows real-time kitchen status updates. Currently under development.</p>
            
            <div className="space-x-4">
              <Link
                href="/kitchen"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                View Kitchen Display
              </Link>
              <Link
                href="/waiter/dashboard"
                className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                🏠 Back to HOME
              </Link>
            </div>
          </div>
        </div>
      </div>
    </WaiterLayout>
  );
}

export default withRoleGuard(KitchenUpdates, ['waiter']);
