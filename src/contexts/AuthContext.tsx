import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { dbService } from '@/lib/storage/indexedDB';
import { UserIdentity } from '@/lib/security/config';

interface AuthContextType {
  currentIdentity: UserIdentity | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (accessCode: string, salt: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshIdentity: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentIdentity, setCurrentIdentity] = useState<UserIdentity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load identity on mount
  useEffect(() => {
    loadStoredIdentity();
  }, []);

  const loadStoredIdentity = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 AuthContext: Loading stored identity...');
      
      // Check if database is initialized
      if (!dbService.isInitialized()) {
        console.log('⚠️ AuthContext: Database not initialized, checking for stored credentials...');
        
        // Try to get stored credentials from localStorage
        const storedAccessCode = localStorage.getItem('dropnet_access_code');
        const storedSalt = localStorage.getItem('dropnet_salt');
        
        if (storedAccessCode && storedSalt) {
          console.log('🔍 AuthContext: Found stored credentials, initializing database...');
          await dbService.init(storedAccessCode, storedSalt);
          console.log('✅ AuthContext: Database initialized with stored credentials');
        } else {
          console.log('❌ AuthContext: No stored credentials found');
          setLoading(false);
          return;
        }
      }
      
      console.log('🔍 AuthContext: Database is initialized, getting identity...');
      const identity = await dbService.get('identity', 'current');
      console.log('🔍 AuthContext: Retrieved identity:', identity);
      
      if (identity) {
        setCurrentIdentity(identity);
        setIsAuthenticated(true);
        console.log('✅ AuthContext: Identity loaded successfully:', identity.nodeId);
      } else {
        console.log('⚠️ AuthContext: No identity found in database');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('❌ AuthContext: Error loading identity:', error);
      setError('Failed to load user identity');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (accessCode: string, salt: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔐 AuthContext: Logging in...');
      
      // Initialize database
      await dbService.init(accessCode, salt);
      console.log('✅ AuthContext: Database initialized');
      
      // Store credentials for persistence
      localStorage.setItem('dropnet_access_code', accessCode);
      localStorage.setItem('dropnet_salt', salt);
      
      console.log('💾 AuthContext: Credentials saved to localStorage');
      console.log('💾 AuthContext: localStorage keys after save:', Object.keys(localStorage));
      console.log('💾 AuthContext: localStorage length after save:', localStorage.length);
      
      // Load identity
      const identity = await dbService.get('identity', 'current');
      
      if (identity) {
        setCurrentIdentity(identity);
        setIsAuthenticated(true);
        console.log('✅ AuthContext: Login successful:', identity.nodeId);
      } else {
        throw new Error('No identity found after login');
      }
    } catch (error) {
      console.error('❌ AuthContext: Login failed:', error);
      setError('Login failed: ' + error.message);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 AuthContext: Logging out...');
      console.log('🚪 AuthContext: Logout called from:', new Error().stack);
      
      // Clear stored credentials
      localStorage.removeItem('dropnet_access_code');
      localStorage.removeItem('dropnet_salt');
      
      // Close database connection
      dbService.close();
      
      // Clear state
      setCurrentIdentity(null);
      setIsAuthenticated(false);
      setError(null);
      
      console.log('✅ AuthContext: Logout successful');
    } catch (error) {
      console.error('❌ AuthContext: Logout error:', error);
    }
  };

  const refreshIdentity = async () => {
    await loadStoredIdentity();
  };

  const value: AuthContextType = {
    currentIdentity,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    refreshIdentity
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 