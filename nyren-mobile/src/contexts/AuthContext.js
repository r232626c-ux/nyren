import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getAuthToken, getProfile, clearAuthToken, saveAuthUser } from '../../services/apiService';
import MemoryStore from '../../services/MemoryStore';

const AuthContext = createContext({
  user: null,
  isLoggedIn: false,
  authLoading: true,
  login: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // derive auth state from user (single source of truth)
  const isLoggedIn = !!user;

  const refreshUser = useCallback(async () => {
    try {
      const token = await getAuthToken();
      console.log('[AuthContext] refreshUser - token present:', !!token);

      if (!token) {
        setUser(null);
        return null;
      }

      const profile = await getProfile();
      console.log('[AuthContext] refreshUser - profile response:', profile);

      const profileUser = profile?.user ?? profile ?? null;

      if (!profileUser) {
        setUser(null);
        return null;
      }

      await saveAuthUser(profileUser);
      setUser(profileUser);
      return profileUser;
    } catch (error) {
      console.log('[AuthContext] refreshUser failed:', error?.message || error);

      await clearAuthToken();
      setUser(null);
      return null;
    }
  }, []);

  const login = useCallback(async () => {
    setAuthLoading(true);
    try {
      const user = await refreshUser();
      return !!user;
    } finally {
      setAuthLoading(false);
    }
  }, [refreshUser]);

  const logout = useCallback(async () => {
    await clearAuthToken();
    MemoryStore.clear();
    setUser(null);
  }, []);

  // restore session on app start
  useEffect(() => {
    let mounted = true;

    const restore = async () => {
      setAuthLoading(true);

      try {
        const token = await getAuthToken();

        if (!token) {
          if (mounted) setUser(null);
          return;
        }

        const profile = await getProfile();
        const profileUser = profile?.user ?? profile ?? null;

        if (mounted) {
          await saveAuthUser(profileUser);
          setUser(profileUser);
        }
      } catch (error) {
        console.log('[AuthContext] restoreAuth failed:', error?.message || error);
        await clearAuthToken();
        if (mounted) setUser(null);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    };

    restore();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        authLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);