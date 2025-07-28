import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dbService } from '@/lib/storage/indexedDB';

const Debug = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const checkDatabaseStatus = async () => {
    addLog('🔍 Checking database status...');
    
    try {
      // Check if database is initialized
      const isInitialized = dbService.isInitialized();
      addLog(`Database initialized: ${isInitialized}`);
      
      // Check localStorage
      const accessCode = localStorage.getItem('dropnet_access_code');
      const salt = localStorage.getItem('dropnet_salt');
      addLog(`localStorage accessCode: ${accessCode ? 'Found' : 'Not found'}`);
      addLog(`localStorage salt: ${salt ? 'Found' : 'Not found'}`);
      
      if (accessCode && salt) {
        addLog('🔧 Attempting to initialize database with stored credentials...');
        try {
          await dbService.init(accessCode, salt);
          addLog('✅ Database initialized successfully');
          
          // Try to get current identity
          const identity = await dbService.get('identity', 'current');
          addLog(`Current identity: ${identity ? 'Found' : 'Not found'}`);
          
          if (identity) {
            addLog(`Identity details: ${identity.nodeId}`);
          }
          
          // Try to get settings
          const settings = await dbService.get('settings', 'security');
          addLog(`Security settings: ${settings ? 'Found' : 'Not found'}`);
          
        } catch (error) {
          addLog(`❌ Failed to initialize database: ${error.message}`);
        }
      } else {
        addLog('❌ No stored credentials found');
      }
      
      // List all databases
      try {
        const databases = await indexedDB.databases();
        const dropnetDatabases = databases.filter(db => 
          db.name && db.name.startsWith('DropNetDB')
        );
        addLog(`Found ${dropnetDatabases.length} DropNet databases`);
        dropnetDatabases.forEach(db => {
          addLog(`  - ${db.name} (version: ${db.version})`);
        });
      } catch (error) {
        addLog(`❌ Could not list databases: ${error.message}`);
      }
      
    } catch (error) {
      addLog(`❌ Error checking database status: ${error.message}`);
    }
  };

  const clearAllData = async () => {
    addLog('🧹 Clearing all data...');
    
    try {
      // Clear localStorage
      localStorage.clear();
      addLog('✅ localStorage cleared');
      
      // Close database
      dbService.close();
      addLog('✅ Database connection closed');
      
      // List databases to see what's left
      const databases = await indexedDB.databases();
      const dropnetDatabases = databases.filter(db => 
        db.name && db.name.startsWith('DropNetDB')
      );
      addLog(`Remaining DropNet databases: ${dropnetDatabases.length}`);
      
    } catch (error) {
      addLog(`❌ Error clearing data: ${error.message}`);
    }
  };

  const testDatabaseCreation = async () => {
    addLog('🧪 Testing database creation...');
    
    try {
      const testAccessCode = 'test123456789';
      const testSalt = 'test_salt_123456789';
      
      addLog('Creating test database...');
      await dbService.init(testAccessCode, testSalt);
      addLog('✅ Test database created');
      
      // Store test data
      const testIdentity = {
        id: 'current',
        publicKey: 'test_key',
        avatar: '🧪',
        nodeId: 'TEST_NODE_001',
        createdAt: Date.now(),
        lastActive: Date.now()
      };
      
      await dbService.put('identity', testIdentity);
      addLog('✅ Test identity stored');
      
      // Retrieve test data
      const retrieved = await dbService.get('identity', 'current');
      addLog(`Retrieved test identity: ${retrieved ? 'Success' : 'Failed'}`);
      
      // Close test database
      dbService.close();
      addLog('✅ Test database closed');
      
    } catch (error) {
      addLog(`❌ Test failed: ${error.message}`);
    }
  };

  useEffect(() => {
    addLog('🚀 Debug page loaded');
    checkDatabaseStatus();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <Card className="bg-card border-2 border-primary p-6 mb-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-2xl text-primary">Database Debug</CardTitle>
        </CardHeader>
        <CardContent className="p-0 space-y-4">
          <div className="flex space-x-2">
            <Button onClick={checkDatabaseStatus} variant="outline">
              🔍 Check Status
            </Button>
            <Button onClick={testDatabaseCreation} variant="outline">
              🧪 Test Creation
            </Button>
            <Button onClick={clearAllData} variant="destructive">
              🧹 Clear All
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Debug Logs:</h3>
            <div className="bg-gray-800 text-green-400 p-4 rounded-md h-96 overflow-y-auto text-sm font-mono">
              {logs.map((log, index) => (
                <p key={index}>{log}</p>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Debug; 