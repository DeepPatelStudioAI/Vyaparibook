import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: { name: string; email: string } | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  signup: (name: string, email: string, password: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface User {
  name: string;
  email: string;
  password: string;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    // Check if user is logged in on mount
    const loggedInUser = localStorage.getItem('currentUser');
    if (loggedInUser) {
      const user = JSON.parse(loggedInUser);
      setCurrentUser(user);
      setIsAuthenticated(true);
    }
  }, []);

  const login = (email: string, password: string): boolean => {
    const storedUsers = localStorage.getItem('vyapariUsers');
    if (!storedUsers) return false;

    const users: User[] = JSON.parse(storedUsers);
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      const userInfo = { name: user.name, email: user.email };
      setCurrentUser(userInfo);
      setIsAuthenticated(true);
      localStorage.setItem('currentUser', JSON.stringify(userInfo));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
  };

  const signup = (name: string, email: string, password: string): boolean => {
    const storedUsers = localStorage.getItem('vyapariUsers');
    const users: User[] = storedUsers ? JSON.parse(storedUsers) : [];

    if (users.some(u => u.email === email)) {
      return false; // Email already exists
    }

    const newUser = { name, email, password };
    users.push(newUser);
    localStorage.setItem('vyapariUsers', JSON.stringify(users));
    return true;
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentUser, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
};