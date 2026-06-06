import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check localStorage on mount to persist login
  useEffect(() => {
    const storedUser = localStorage.getItem('voltforge_user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user from local storage");
      }
    }
    setLoading(false);
  }, []);

  const login = (user) => {
    setCurrentUser(user);
    // Don't save password in local storage, just the profile
    const safeUser = { ...user };
    delete safeUser.password;
    localStorage.setItem('voltforge_user', JSON.stringify(safeUser));
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('voltforge_user');
  };

  const updateCurrentUser = (updatedUser) => {
    login(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, updateCurrentUser, loading, isAuthenticated: !!currentUser }}>
      {children}
    </AuthContext.Provider>
  );
};
