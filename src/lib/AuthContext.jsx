import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';

const AuthContext = createContext();

const anonymousAuthState = {
  user: null,
  isAuthenticated: false,
  isLoadingAuth: false,
  isLoadingPublicSettings: false,
  authError: null,
  appPublicSettings: null,
  authChecked: true,
};

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    ...anonymousAuthState,
    isLoadingAuth: true,
    authChecked: false,
  });

  const checkAppState = useCallback(async () => {
    setAuthState(anonymousAuthState);
  }, []);

  const checkUserAuth = useCallback(async () => {
    setAuthState(anonymousAuthState);
  }, []);

  const logout = useCallback(() => {
    setAuthState(anonymousAuthState);
  }, []);

  const navigateToLogin = useCallback(() => {
    setAuthState(anonymousAuthState);
  }, []);

  useEffect(() => {
    checkAppState();
  }, [checkAppState]);

  return (
    <AuthContext.Provider value={{
      ...authState,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
