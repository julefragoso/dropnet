import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { p2pService } from '@/lib/p2p/p2pService';
import { messageService } from '@/lib/messages/messageService';
import { dbService } from '@/lib/storage/indexedDB';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from "@/components/ui/toaster";

export default function MessageDebug() {
  const { toast } = useToast();
  const [identity, setIdentity] = useState<any>(null);
  const [identityLoading, setIdentityLoading] = useState(true);
  const [targetShortId, setTargetShortId] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [receivedMessages, setReceivedMessages] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [userMessages, setUserMessages] = useState<any[]>([]);
  
  // Load identity and initialize services
  useEffect(() => {
    const loadIdentityAndInitialize = async () => {
      try {
        setIdentityLoading(true);
        console.log('🔧 Loading identity and initializing services...');
        
        // Get real user identity from localStorage
        const storedIdentity = localStorage.getItem('dropnet_identity');
        const accessCode = localStorage.getItem('dropnet_access_code');
        const salt = localStorage.getItem('dropnet_salt');
        
        if (!storedIdentity || !accessCode || !salt) {
          console.error('❌ No user identity found in localStorage');
          setIdentityLoading(false);
          return;
        }

        const userIdentity = JSON.parse(storedIdentity);
        console.log('✅ Identity loaded:', userIdentity);
        setIdentity(userIdentity);

        // Initialize database
        if (!dbService.isInitialized()) {
          console.log('🔄 Initializing database...');
          await dbService.init(accessCode, salt);
        }

        // Initialize services with real user identity
        console.log('🔄 Initializing message service...');
        await messageService.initialize(userIdentity.nodeId, userIdentity.id);
        
        console.log('🔄 Initializing P2P service...');
        await p2pService.initialize(userIdentity.id, userIdentity.nodeId, accessCode, userIdentity.id);
        
        console.log('✅ All services initialized');

        // Load user's messages
        await loadUserMessages(userIdentity.id);
        
      } catch (error) {
        console.error('❌ Error loading identity:', error);
      } finally {
        setIdentityLoading(false);
      }
    };

    loadIdentityAndInitialize();
  }, []);

  // Load user's messages from database
  const loadUserMessages = async (userId: string) => {
    try {
      console.log('📨 Loading messages for user:', userId);
      const conversations = await messageService.getUserConversations(userId);
      console.log('📨 Loaded conversations:', conversations);
      
      // Convert conversations to messages for display
      const allMessages: any[] = [];
      for (const conversation of conversations) {
        if (conversation.lastMessage) {
          allMessages.push({
            id: conversation.lastMessage.id,
            fromUserId: conversation.lastMessage.senderId,
            toUserId: conversation.lastMessage.receiverId,
            content: conversation.lastMessage.content,
            timestamp: conversation.lastMessage.timestamp,
            isEncrypted: conversation.lastMessage.isEncrypted || false
          });
        }
      }
      
      // Sort by timestamp (newest first)
      allMessages.sort((a, b) => b.timestamp - a.timestamp);
      setUserMessages(allMessages);
      console.log('✅ Loaded messages:', allMessages.length);
      
    } catch (error) {
      console.error('❌ Error loading messages:', error);
    }
  };

  // Set up message handlers and connection monitoring
  useEffect(() => {
    if (!identity?.id) return;

    console.log('🔄 Setting up message handlers for identity:', identity.id);
    
    // Set up message handler for incoming messages
    const handleEncryptedMessage = (data: any) => {
      console.log('📨 Received message:', data);
      setReceivedMessages(prev => [data, ...prev]);
      toast({
        title: "Message Received",
        description: `From: ${data.fromNodeId}`,
      });
      
      // Reload messages after receiving new one
      loadUserMessages(identity.id);
    };

    p2pService.onSignalingMessage('encryptedMessage', handleEncryptedMessage);

    // Check connection status periodically
    const interval = setInterval(() => {
      const connections = p2pService.getConnections();
      setConnectionStatus(connections.length > 0 ? `Connected (${connections.length} peers)` : 'Disconnected');
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [identity, toast]);

  const sendMessage = async () => {
    if (!targetShortId || !messageContent) {
      toast({
        title: "Error",
        description: "Please enter both Short ID and message content",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('📤 Sending message to Short ID:', targetShortId);
      
      // Create message object
      const encryptedMessage = {
        id: crypto.randomUUID(),
        senderId: identity?.id || 'Unknown',
        receiverId: targetShortId,
        content: messageContent,
        timestamp: Date.now(),
        isEncrypted: true
      };

      const success = await p2pService.sendSignalingMessageByShortId('sendEncryptedMessageByShortId', {
        targetShortId: targetShortId,
        encryptedMessage: encryptedMessage,
        senderNodeId: identity?.nodeId || 'Unknown'
      });

      if (success) {
        // Save message locally
        await messageService.createMessage(
          identity?.id || 'Unknown',
          targetShortId,
          messageContent,
          'text'
        );

        toast({
          title: "Message Sent",
          description: `To Short ID: ${targetShortId}`,
        });

        setMessageContent('');
        console.log('✅ Message sent successfully');
        
        // Reload messages
        await loadUserMessages(identity.id);
      } else {
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      toast({
        title: "Error",
        description: `Error: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const createNewIdentity = () => {
    console.log('🆔 Creating new identity...');
    // Create new identity
    const newIdentity = {
      id: crypto.randomUUID(),
      nodeId: `NODE_${Math.floor(Math.random() * 90000) + 10000}`,
      publicKey: 'test-public-key-' + Math.random().toString(36).substring(7),
      avatar: 'default-avatar',
      createdAt: Date.now(),
      lastActive: Date.now()
    };
    
    const accessCode = 'access-code-' + Math.random().toString(36).substring(7);
    const salt = 'salt-' + Math.random().toString(36).substring(7);
    
    // Save to localStorage
    localStorage.setItem('dropnet_identity', JSON.stringify(newIdentity));
    localStorage.setItem('dropnet_access_code', accessCode);
    localStorage.setItem('dropnet_salt', salt);
    
    console.log('✅ New identity created:', newIdentity);
    toast({
      title: "Identity Created",
      description: `Short ID: ${newIdentity.id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase()}`,
    });
    
    // Reload page to initialize with new identity
    setTimeout(() => window.location.reload(), 1000);
  };

  if (identityLoading) {
    return <div className="p-8">Loading identity...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Toaster />
      <Card>
        <CardHeader>
          <CardTitle>Message Debug Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Identity Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-bold">Your Identity</h3>
              <p>ID: {identity?.id || 'null'}</p>
              <p>Node ID: {identity?.nodeId || 'null'}</p>
              <p>Short ID: {identity?.id ? identity.id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() : 'N/A'}</p>
            </div>
            <div>
              <h3 className="font-bold">Connection Status</h3>
              <p>{connectionStatus}</p>
            </div>
          </div>

          {/* Send Message */}
          <div className="space-y-4">
            <h3 className="font-bold">Send Message</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Target Short ID (e.g., F26C)"
                value={targetShortId}
                onChange={(e) => setTargetShortId(e.target.value.toUpperCase())}
                maxLength={4}
              />
              <Input
                placeholder="Message content"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
              />
              <Button onClick={sendMessage}>Send</Button>
            </div>
          </div>

          {/* User Messages */}
          <div className="space-y-4">
            <h3 className="font-bold">Your Messages</h3>
            <div className="max-h-60 overflow-y-auto border rounded p-4">
              {userMessages.length === 0 ? (
                <p className="text-gray-500">No messages found</p>
              ) : (
                userMessages.map((message, index) => (
                  <div key={index} className="mb-3 p-3 border rounded">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>From: {message.fromUserId}</span>
                      <span>To: {message.toUserId}</span>
                      <span>{new Date(message.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="mt-1">
                      <strong>Content:</strong> {message.content}
                    </div>
                  </div>
                ))
              )}
            </div>
            <Button 
              onClick={() => identity?.id && loadUserMessages(identity.id)} 
              variant="outline"
            >
              Refresh Messages
            </Button>
          </div>

          {/* Received Messages */}
          <div className="space-y-4">
            <h3 className="font-bold">Received Messages (Real-time)</h3>
            <div className="max-h-60 overflow-y-auto border rounded p-4">
              {receivedMessages.length === 0 ? (
                <p className="text-gray-500">No real-time messages received</p>
              ) : (
                receivedMessages.map((message, index) => (
                  <div key={index} className="mb-3 p-3 border rounded bg-blue-50">
                    <div className="text-sm text-gray-600">
                      <span>From: {message.fromNodeId}</span>
                      <span className="ml-4">{new Date(message.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="mt-1">
                      <strong>Data:</strong> {JSON.stringify(message.data, null, 2)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Debug Information */}
          <div className="space-y-4">
            <h3 className="font-bold">Debug Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded p-4">
                <h4 className="font-semibold mb-2">localStorage Status</h4>
                <div className="text-sm space-y-1">
                  <div>Identity: {localStorage.getItem('dropnet_identity') ? '✅ Present' : '❌ Missing'}</div>
                  <div>Access Code: {localStorage.getItem('dropnet_access_code') ? '✅ Present' : '❌ Missing'}</div>
                  <div>Salt: {localStorage.getItem('dropnet_salt') ? '✅ Present' : '❌ Missing'}</div>
                </div>
              </div>
              <div className="border rounded p-4">
                <h4 className="font-semibold mb-2">Service Status</h4>
                <div className="text-sm space-y-1">
                  <div>Message Service: {identity ? '✅ Initialized' : '❌ Not Initialized'}</div>
                  <div>P2P Service: {connectionStatus}</div>
                  <div>Database: {dbService.isInitialized() ? '✅ Initialized' : '❌ Not Initialized'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {!identity && (
              <Button 
                onClick={createNewIdentity} 
                variant="default"
                className="bg-green-600 hover:bg-green-700"
              >
                Create New Identity
              </Button>
            )}
            <Button 
              onClick={async () => {
                try {
                  console.log('🔍 Running detailed debug...');
                  
                  // Check localStorage
                  const identity = localStorage.getItem('dropnet_identity');
                  const accessCode = localStorage.getItem('dropnet_access_code');
                  const salt = localStorage.getItem('dropnet_salt');
                  
                  console.log('📦 localStorage contents:');
                  console.log('  Identity:', identity);
                  console.log('  Access Code:', accessCode);
                  console.log('  Salt:', salt);
                  
                  // Check IndexedDB
                  if (dbService.isInitialized()) {
                    const messages = await dbService.getAll('messages');
                    const conversations = await dbService.getAll('conversations');
                    
                    console.log('🗄️ IndexedDB contents:');
                    console.log('  Messages:', messages.length);
                    console.log('  Conversations:', conversations.length);
                    
                    if (messages.length > 0) {
                      console.log('  Sample message:', messages[0]);
                    }
                  }
                  
                  // Check services
                  console.log('🔧 Service status:');
                  console.log('  Message Service initialized:', !!identity);
                  console.log('  P2P connections:', p2pService.getConnections().length);
                  
                } catch (error) {
                  console.error('❌ Debug error:', error);
                }
              }} 
              variant="outline"
            >
              Run Detailed Debug
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}