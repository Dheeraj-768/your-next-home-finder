import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export type UserRole = "admin" | "owner" | "resident" | null;

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: AppUser | null;
  login: (email: string, password: string, role: UserRole) => boolean;
  logout: () => void;
  isAdmin: boolean;
  isOwner: boolean;
  isResident: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USERS: Record<string, AppUser & { password: string }> = {
  "admin@stayfinder.com": { id: "u-admin", name: "Super Admin", email: "admin@stayfinder.com", role: "admin", password: "admin123" },
  "owner@stayfinder.com": { id: "u-owner", name: "Rajesh Kumar", email: "owner@stayfinder.com", role: "owner", password: "owner123" },
  "resident@stayfinder.com": { id: "u-res1", name: "Arjun Mehta", email: "resident@stayfinder.com", role: "resident", password: "res123" },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => {
    const stored = localStorage.getItem("sf_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback((email: string, password: string, role: UserRole): boolean => {
    const demo = DEMO_USERS[email];
    if (demo && demo.password === password && demo.role === role) {
      const u: AppUser = { id: demo.id, name: demo.name, email: demo.email, role: demo.role };
      setUser(u);
      localStorage.setItem("sf_user", JSON.stringify(u));
      return true;
    }
    // Allow any login for demo with chosen role
    const u: AppUser = { id: `u-${Date.now()}`, name: email.split("@")[0], email, role };
    setUser(u);
    localStorage.setItem("sf_user", JSON.stringify(u));
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("sf_user");
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAdmin: user?.role === "admin",
      isOwner: user?.role === "owner",
      isResident: user?.role === "resident",
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
