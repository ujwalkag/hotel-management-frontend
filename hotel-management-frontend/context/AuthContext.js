import { createContext, useContext, useReducer, useEffect } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, loading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.access,
        refreshToken: action.payload.refresh,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return { ...initialState, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();

  // FIXED: Consistent API URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://www.hotelrshammad.co.in/api';

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');

      if (token && refreshToken) {
        // Verify token
        const response = await fetch(`${API_BASE_URL}/auth/verify/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user: userData.user || userData,
              access: token,
              refresh: refreshToken,
            },
          });
        } else {
          await refreshAccessToken();
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        dispatch({ type: 'AUTH_LOGOUT' });
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access);

        const userResponse = await fetch(`${API_BASE_URL}/users/profile/`, {
          headers: { 'Authorization': `Bearer ${data.access}` },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user: userData,
              access: data.access,
              refresh: refreshToken,
            },
          });
          return true;
        }
      }

      dispatch({ type: 'AUTH_LOGOUT' });
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      dispatch({ type: 'AUTH_LOGOUT' });
      return false;
    }
  };

 // FIXED: makeAuthenticatedRequest function for AuthContext.js

const makeAuthenticatedRequest = async (url, options = {}) => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      console.warn('No access token found, redirecting to login');
      router.push('/login');
      throw new Error('No access token found');
    }

    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const requestOptions = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    // FIXED: Handle relative URLs properly to avoid double /api/
    let requestUrl;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // Absolute URL, use as-is
      requestUrl = url;
    } else if (url.startsWith('/api/')) {
      // API URL already has /api/, just use the domain + path
      requestUrl = `${window.location.protocol}//${window.location.host}${url}`;
    } else {
      // Relative URL, add /api prefix
      requestUrl = `${window.location.protocol}//${window.location.host}/api${url.startsWith('/') ? url : '/' + url}`;
    }

    console.log(`🔗 Making authenticated request to: ${requestUrl}`);

    let response = await fetch(requestUrl, requestOptions);

    // If token expired, try to refresh
    if (response.status === 401) {
      console.warn('Token expired, attempting refresh...');
      const refreshSuccess = await refreshAccessToken();
      if (refreshSuccess) {
        // Retry with new token
        const newToken = localStorage.getItem('access_token');
        console.log('🔄 Retrying request with refreshed token');
        response = await fetch(requestUrl, {
          ...requestOptions,
          headers: {
            ...requestOptions.headers,
            'Authorization': `Bearer ${newToken}`,
          },
        });
      } else {
        // Refresh failed, redirect to login
        console.error('Token refresh failed, redirecting to login');
        router.push('/login');
        return null;
      }
    }

    if (!response.ok && response.status !== 401) {
      console.error(`❌ Request failed: ${response.status} ${response.statusText}`);
    } else {
      console.log(`✅ Request successful: ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error('❌ Request failed:', error);
    throw error;
  }
};

  const login = async (email, password) => {
    dispatch({ type: 'AUTH_START' });

    try {
      const response = await fetch(`${API_BASE_URL}/auth/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);

        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: data,
            access: data.access,
            refresh: data.refresh,
          },
        });

        toast.success('Login successful!');

        const redirectPath = getRedirectPath(data.role);
        router.push(redirectPath);

        return { success: true };
      } else {
        const errorMsg = data.detail || data.message || 'Login failed';
        dispatch({ type: 'AUTH_FAILURE', payload: errorMsg });
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      const errorMsg = 'Network error. Please try again.';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMsg });
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await fetch(`${API_BASE_URL}/users/logout/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      dispatch({ type: 'AUTH_LOGOUT' });
      router.push('/login');
      toast.success('Logged out successfully');
    }
  };

  const getRedirectPath = (role) => {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'staff':
        return '/staff/dashbaord';
      case 'waiter':
        return '/staff/';
      case 'biller':
        return '/staff/';
      default:
        return '/';
    }
  };

  const hasRole = (roles) => {
    if (!state.user || !roles) return false;
    if (typeof roles === 'string') {
      return state.user.role === roles;
    }
    return roles.includes(state.user.role);
  };

  const hasPermission = (permission) => {
    if (!state.user) return false;
    const permissions = {
      can_create_orders: state.user.can_create_orders,
      can_generate_bills: state.user.can_generate_bills,
      can_access_kitchen: state.user.can_access_kitchen,
    };
    return permissions[permission] || false;
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  useEffect(() => {
    if (state.token) {
      const interval = setInterval(() => {
        refreshAccessToken();
      }, 50 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [state.token]);

  // CRITICAL FIX: Include makeAuthenticatedRequest in the context value
  const value = {
    ...state,
    login,
    logout,
    hasRole,
    hasPermission,
    clearError,
    refreshAccessToken,
    makeAuthenticatedRequest, // Add this line
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

