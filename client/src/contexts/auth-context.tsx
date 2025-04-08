import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

// User type definition
interface User {
  id: string;
  username: string;
  email?: string;
  token: string;
}

// Auth context state
interface AuthContextState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Create context with default values
const AuthContext = createContext<AuthContextState>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
});

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Create provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check for stored user
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          // Verify token is still valid with backend
          await apiRequest({
            url: "/api/auth/me",
            method: "GET",
            headers: {
              Authorization: `Bearer ${parsedUser.token}`,
            },
          });
        }
      } catch (error) {
        // Clear invalid auth data
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await apiRequest<User>({
        url: "/api/auth/login",
        method: "POST",
        data: { email, password },
      });

      const userData = {
        id: response.id,
        username: response.username,
        email: response.email,
        token: response.token,
      };

      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      setLocation("/dashboard");
    } catch (error) {
      throw error;
    }
  };

  // Signup function
  const signup = async (username: string, email: string, password: string): Promise<void> => {
    try {
      const response = await apiRequest<User>({
        url: "/api/auth/signup",
        method: "POST",
        data: { username, email, password },
      });

      const userData = {
        id: response.id,
        username: response.username,
        email: response.email,
        token: response.token,
      };

      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      setLocation("/dashboard");
    } catch (error) {
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await apiRequest({
        url: "/api/auth/logout",
        method: "POST",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("user");
      setUser(null);
      setLocation("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook for using auth context
export const useAuth = () => useContext(AuthContext);

// HOC for protected routes
export function withAuth<P>(Component: React.ComponentType<P>) {
  return function ProtectedRoute(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    const [, setLocation] = useLocation();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        setLocation("/login");
      }
    }, [isLoading, isAuthenticated, setLocation]);

    if (isLoading) {
      return (
        <div className="flex h-screen items-center justify-center bg-[#12121a]">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 animate-spin text-[#6a6aff]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="mt-4 text-xl font-medium text-white">Loading...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null; // Will redirect to login via the useEffect
    }

    return <Component {...props} />;
  };
}