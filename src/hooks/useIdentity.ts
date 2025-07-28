import { useState, useEffect } from 'react';
import { dbService } from '@/lib/storage/indexedDB';
import { UserIdentity } from '@/lib/security/config';

export const useIdentity = () => {
  const [currentIdentity, setCurrentIdentity] = useState<UserIdentity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('🔄 useIdentity hook initialized');

  // Load current identity on mount
  useEffect(() => {
    console.log('🔄 useIdentity useEffect triggered');
    loadCurrentIdentity();
  }, []);

  const loadCurrentIdentity = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading current identity...');
      console.log('🔍 Database initialized:', dbService.isInitialized());
      
      // Check if database is initialized
      if (!dbService.isInitialized()) {
        console.log('⏳ Database not initialized, checking for stored credentials...');
        
        // Try to get stored credentials from localStorage
        const storedAccessCode = localStorage.getItem('dropnet_access_code');
        const storedSalt = localStorage.getItem('dropnet_salt');
        
        console.log('🔍 Stored credentials check:', {
          accessCode: storedAccessCode ? 'Found' : 'Not found',
          salt: storedSalt ? 'Found' : 'Not found'
        });
        
        if (storedAccessCode && storedSalt) {
          console.log('🔍 Found stored credentials, initializing database...');
          try {
            await dbService.init(storedAccessCode, storedSalt);
            console.log('✅ Database initialized with stored credentials');
          } catch (initError) {
            console.error('❌ Failed to initialize database with stored credentials:', initError);
            setError('Failed to initialize database with stored credentials. Please complete onboarding again.');
            setLoading(false);
            return;
          }
        } else {
          console.log('❌ No stored credentials found');
          setError('No user identity found. Please complete onboarding first.');
          setLoading(false);
          return;
        }
      }
      
      console.log('🔍 Database is initialized, getting identity...');
      const identity = await dbService.get('identity', 'current');
      console.log('🔍 Retrieved identity:', identity);
      
      if (identity) {
        setCurrentIdentity(identity);
        console.log('✅ Identity loaded successfully:', identity.nodeId);
      } else {
        console.log('⚠️ No identity found in database');
        setError('No user identity found. Please complete onboarding first.');
      }
    } catch (error) {
      console.error('❌ Error loading current identity:', error);
      setError('Failed to load user identity');
    } finally {
      setLoading(false);
    }
  };

  const setCurrentIdentityAndSave = async (identity: UserIdentity) => {
    try {
      // Save as current identity
      await dbService.put('identity', { ...identity, id: 'current' });
      setCurrentIdentity(identity);
      setError(null);
    } catch (error) {
      console.error('Error saving current identity:', error);
      setError('Failed to save current identity');
    }
  };

  const clearCurrentIdentity = async () => {
    try {
      await dbService.delete('identity', 'current');
      setCurrentIdentity(null);
      setError('No user identity found. Please complete onboarding first.');
    } catch (error) {
      console.error('Error clearing current identity:', error);
    }
  };

  return {
    currentIdentity,
    loading,
    error,
    loadCurrentIdentity,
    setCurrentIdentityAndSave,
    clearCurrentIdentity
  };
}; 