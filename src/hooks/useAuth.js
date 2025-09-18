import { useState, useEffect } from 'react';
import { getUserInfo, isAuthenticated, logout } from '../services/auth';

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [auth, setAuth] = useState(false);

  useEffect(() => {
    const isAuth = isAuthenticated();
    setAuth(isAuth);
    if (isAuth) {
      setUser(getUserInfo());
    } else {
      setUser(null);
    }
  }, []);

  return {
    user,
    isAuthenticated: auth,
    logout,
  };
} 