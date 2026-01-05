import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, User } from '../api/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Check if user is logged in on mount
   * Uses cookie-based authentication (cookies sent automatically)
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Cookies are sent automatically by browser (withCredentials: true)
        // Backend reads token from cookie
        const response = await authApi.getMe();
        // Backend returns { success: true, data: user }
        // authApi.getMe() returns response.data which is the user object
        setUser(response.data);
      } catch (error) {
        // Cookie invalid or expired - clear user state
        // Cookies are cleared by backend on logout
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    // Backend sets accessToken as HTTP-only cookie automatically
    // No need to store in localStorage - cookie is sent automatically
    // Backend returns { success: true, data: user } (no accessToken in body)
    setUser(response.data);
  };

  const register = async (email: string, password: string, name?: string) => {
    try {
      // Backend register endpoint sets accessToken as HTTP-only cookie automatically
      // Backend returns { success: true, data: user } (no accessToken in body)
      const response = await authApi.register({ email, password, name });
      
      // User is already authenticated via cookie set by backend
      // No need to call login - backend auto-logs in after registration
      setUser(response.data);
    } catch (error: any) {
      // Re-throw the error so the Register page can handle it
      // The error will have err.response?.data?.error from backend
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
      // Backend clears cookies automatically
    } catch (error) {
      // Even if logout fails, clear local state
      console.error('Logout error:', error);
    } finally {
      // Cookies are cleared by backend - no need to clear localStorage
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.getMe();
      setUser(response.data);
    } catch (error) {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

