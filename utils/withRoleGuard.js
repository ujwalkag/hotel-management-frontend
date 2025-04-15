import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function withRoleGuard(Component, allowedRoles = []) {
  return function GuardedComponent(props) {
    const router = useRouter();

    useEffect(() => {
      const userRole = localStorage.getItem('role');
      if (!allowedRoles.includes(userRole)) {
        router.push('/unauthorized');
      }
    }, []);

    return <Component {...props} />;
  };
}

