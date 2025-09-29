import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

const UniversalHomeButton = ({ 
  variant = 'primary', 
  size = 'normal',
  className = '',
  showText = true 
}) => {
  const router = useRouter();
  const { user } = useAuth();
  
  const getHomePath = () => {
    const currentPath = router.pathname;
    
    if (currentPath.startsWith('/admin')) return '/admin/dashboard';
    if (currentPath.startsWith('/staff')) return '/staff/dashboard';
    if (currentPath.startsWith('/waiter')) return '/waiter/dashboard';
    
    if (user?.role === 'admin') return '/admin/dashboard';
    if (user?.role === 'staff') return '/staff/dashboard';
    if (user?.role === 'waiter') return '/waiter/dashboard';
    
    return '/admin/dashboard';
  };

  const variants = {
    primary: 'bg-purple-600 hover:bg-purple-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white'
  };

  const sizes = {
    small: 'px-2 py-1 text-xs',
    normal: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base'
  };

  return (
    <Link
      href={getHomePath()}
      className={`
        ${variants[variant]} 
        ${sizes[size]} 
        rounded-lg font-bold 
        transition-colors duration-200 
        flex items-center gap-2 
        hover:scale-105 
        ${className}
      `}
    >
      <span>🏠</span>
      {showText && <span>Home</span>}
    </Link>
  );
};

export default UniversalHomeButton;

