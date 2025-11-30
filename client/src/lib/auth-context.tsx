import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, displayName: string, role: "student" | "admin", password: string, isSignUp: boolean) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("tower_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("tower_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, displayName: string, role: "student" | "admin", password: string, isSignUp: boolean) => {
    setIsLoading(true);
    try {
      const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";
      
      // For registration, send all fields; for login, send only email and password
      const body = isSignUp
        ? { email, displayName, role, password }
        : { email, password };
      
      console.log(`[Auth] ${isSignUp ? "Register" : "Login"} attempt to ${endpoint}`, body);
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      const responseData = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        console.error(`[Auth] ${isSignUp ? "Register" : "Login"} failed:`, responseData);
        throw new Error(responseData.error || `Authentication failed (${response.status})`);
      }
      
      if (!responseData.id) {
        console.error(`[Auth] Response missing user ID:`, responseData);
        throw new Error("Invalid response from server");
      }
      
      console.log(`[Auth] ${isSignUp ? "Register" : "Login"} succeeded for ${responseData.email}`);
      setUser(responseData);
      localStorage.setItem("tower_user", JSON.stringify(responseData));
    } catch (err: any) {
      console.error(`[Auth] Error:`, err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("tower_user");
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem("tower_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
