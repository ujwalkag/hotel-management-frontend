import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function WaiterIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/waiter/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to waiter dashboard...</p>
        <Link href="/waiter/dashboard" className="mt-4 inline-block bg-purple-600 text-white px-4 py-2 rounded-lg">
          🏠 Go to HOME
        </Link>
      </div>
    </div>
  );
}
