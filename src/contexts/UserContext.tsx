import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface User {
  name: string;
  email?: string;
  token: string;
  avatarUrl?: string;
}

interface UserContextType {
  user?: User;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// ✅ This allows other components to access the user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | undefined>(undefined);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch("http://localhost:8000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Login failed");
    }

    const data = await res.json();
    console.log("Login response data:", data);
    const u = { name: data.user.name, email: data.user.email, token: data.access_token };
    setUser(u);
    localStorage.setItem("user", JSON.stringify(u));
    localStorage.setItem("token", data.access_token);
  };

  const signup = async (name: string, email: string, password: string) => {
    const res = await fetch("http://localhost:8000/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Signup failed");
    }

    // Automatically log in after signup
    await login(email, password);
  };

  const logout = () => {
    setUser(undefined);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <UserContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </UserContext.Provider>
  );
};
