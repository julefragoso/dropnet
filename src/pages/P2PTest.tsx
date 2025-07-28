import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useIdentity } from '@/hooks/useIdentity';
import { p2pService } from '@/lib/p2p/p2pService';
import { dbService } from '@/lib/storage/indexedDB';
import { io, Socket } from 'socket.io-client';

interface PeerInfo {
  nodeId: string;
  accessCode: string;
}

const P2PTest = () => {
  console.log('🔄 P2PTest component rendering');
  
  // Use the same method as Dashboard (which works)
  const { currentIdentity, loading, error } = useIdentity();
  const [availablePeers, setAvailablePeers] = useState<PeerInfo[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  console.log('🔄 P2PTest state:', { currentIdentity, loading, error });
  
  // Initialize P2P service when identity is loaded (same as Dashboard)
  useEffect(() => {
    const initializeP2P = async () => {
      try {
        if (currentIdentity) {
          console.log('🔧 P2PTest: Initializing P2P service...');
          console.log('📋 Identity:', {
            id: currentIdentity.id,
            nodeId: currentIdentity.nodeId
          });
          
          await p2pService.initialize(
            currentIdentity.id, 
            currentIdentity.nodeId, 
            currentIdentity.nodeId // Using nodeId as accessCode for now
          );
          
          console.log('✅ P2PTest: P2P service initialized successfully');
        }
      } catch (error) {
        console.error('❌ P2PTest: Error initializing P2P service:', error);
      }
    };

    initializeP2P();
  }, [currentIdentity]);

  const addLog = (message: string) => {
    console.log(message);
    setDebugLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    if (currentIdentity) {
      addLog(`👤 Identity loaded: ${currentIdentity.nodeId}`);
      
      // Kill any existing socket
      if (socket) {
        socket.disconnect();
      }

      addLog('🔧 Creating new socket connection...');
      
      // Create new socket connection
      addLog('🔧 Attempting to connect to signaling server...');
      const newSocket = io('http://localhost:3001', {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      newSocket.on('connect', () => {
        addLog('✅ Socket connected successfully!');
        setIsConnected(true);
        
        // Register with the signaling server
        addLog(`📝 Registering as: ${currentIdentity.nodeId}`);
        newSocket.emit('register', {
          nodeId: currentIdentity.nodeId,
          accessCode: currentIdentity.nodeId
        });
        
        // Request peer list after a short delay
        setTimeout(() => {
          addLog('📋 Requesting peer list...');
          newSocket.emit('getPeers');
        }, 1000);
      });

      newSocket.on('connect_error', (error) => {
        addLog(`❌ Connection error: ${error.message}`);
        addLog(`🔍 Error details: ${JSON.stringify(error)}`);
        setIsConnected(false);
      });

      newSocket.on('disconnect', (reason) => {
        addLog(`❌ Socket disconnected: ${reason}`);
        setIsConnected(false);
      });

      // Handle peer list updates
      newSocket.on('peerList', (peers: PeerInfo[]) => {
        addLog(`📋 Received peer list: ${peers.length} peers`);
        console.log('Raw peer list:', peers);
        setAvailablePeers(peers);
      });

      // Handle any other events
      newSocket.onAny((eventName, ...args) => {
        addLog(`📡 Event: ${eventName} - ${JSON.stringify(args)}`);
      });

      // Add error handling for socket
      newSocket.on('error', (error) => {
        addLog(`🚨 Socket error: ${error.message}`);
      });

      setSocket(newSocket);
    }

    return () => {
      if (socket) {
        addLog('🧹 Cleaning up socket connection');
        socket.disconnect();
      }
    };
  }, [currentIdentity]);

  const requestPeerList = () => {
    if (socket && socket.connected) {
      addLog('🔄 Manually requesting peer list...');
      socket.emit('getPeers');
    } else {
      addLog('❌ Socket not connected, cannot request peers');
    }
  };

  const clearLogs = () => {
    setDebugLogs([]);
  };

  // Add manual test function
  const testDatabaseManually = async () => {
    addLog('🧪 Manual database test started...');
    
    try {
      // Check localStorage
      const accessCode = localStorage.getItem('dropnet_access_code');
      const salt = localStorage.getItem('dropnet_salt');
      
      addLog(`localStorage accessCode: ${accessCode ? 'Found' : 'Not found'}`);
      addLog(`localStorage salt: ${salt ? 'Found' : 'Not found'}`);
      
      if (!accessCode || !salt) {
        addLog('❌ No credentials found in localStorage');
        return;
      }
      
      // Try to initialize database
      addLog('🔧 Initializing database...');
      await dbService.init(accessCode, salt);
      addLog('✅ Database initialized');
      
      // Try to get identity
      addLog('🔍 Getting current identity...');
      const identity = await dbService.get('identity', 'current');
      addLog(`Identity found: ${identity ? 'Yes' : 'No'}`);
      
      if (identity) {
        addLog(`Identity details: ${identity.nodeId}`);
        // Force reload the component
        window.location.reload();
      } else {
        addLog('❌ No identity found in database');
      }
      
    } catch (error) {
      addLog(`❌ Error: ${error.message}`);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">⏳ Loading...</h2>
            <p className="text-muted-foreground">Attempting to load identity and connect to P2P network.</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-red-500">
            <h2 className="text-2xl font-bold mb-4">❌ Error</h2>
            <p className="text-muted-foreground">{error}</p>
            <p className="text-muted-foreground mt-2">Please ensure you have completed onboarding and are logged in.</p>
          </div>
        </div>
      </div>
    );
  }

  // Show not authenticated state
  if (!currentIdentity) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">⚠️ Not Authenticated</h2>
            <p className="text-muted-foreground">Please go to the <a href="/onboarding" className="text-primary underline">Onboarding page</a> to create or access your identity.</p>
            <div className="mt-4 p-4 bg-gray-800 text-green-400 rounded text-sm font-mono">
              <p>Debug Info:</p>
              <p>Loading: {loading.toString()}</p>
              <p>Error: {error || 'None'}</p>
              <p>localStorage accessCode: {localStorage.getItem('dropnet_access_code') ? 'Found' : 'Not found'}</p>
              <p>localStorage salt: {localStorage.getItem('dropnet_salt') ? 'Found' : 'Not found'}</p>
              <p>Database initialized: {dbService.isInitialized().toString()}</p>
            </div>
            <div className="mt-4 flex space-x-2">
              <Button onClick={testDatabaseManually} variant="outline">
                🧪 Test Database
              </Button>
              <Button onClick={() => window.location.href = '/debug'} variant="outline">
                🔍 Debug Database
              </Button>
              <Button onClick={() => window.location.href = '/secure-messaging'} variant="default">
                🔐 Secure Messaging
              </Button>
              <Button onClick={() => window.location.href = '/onboarding'} variant="outline">
                🔑 Go to Onboarding
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="bg-card border-2 border-primary p-6 mb-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-2xl text-primary">P2P Test Page</CardTitle>
        </CardHeader>
        <CardContent className="p-0 space-y-4">
          <div className="flex items-center space-x-2">
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
            </Badge>
            <span className="text-foreground">
              {currentIdentity ? `Your Node ID: ${currentIdentity.nodeId}` : 'No Identity Loaded'}
            </span>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Available Peers:</h3>
            {availablePeers.length > 0 ? (
              <ul className="list-disc list-inside text-muted-foreground">
                {availablePeers.map((peer, index) => (
                  <li key={index}>{peer.nodeId} ({peer.accessCode})</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No peers detected yet.</p>
            )}
          </div>

          <div className="flex space-x-2">
            <Button onClick={requestPeerList} disabled={!isConnected}>Request Peer List</Button>
            <Button onClick={clearLogs} variant="outline">Clear Logs</Button>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Debug Logs:</h3>
            <div className="bg-gray-800 text-green-400 p-4 rounded-md h-64 overflow-y-auto text-sm font-mono">
              {debugLogs.map((log, index) => (
                <p key={index}>{log}</p>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default P2PTest; 