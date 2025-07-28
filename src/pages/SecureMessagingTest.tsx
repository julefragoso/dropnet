import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useIdentity } from '@/hooks/useIdentity';
import { secureMessagingService, SecureMessage, Conversation } from '@/lib/p2p/secureMessaging';
import { p2pService } from '@/lib/p2p/p2pService';

const SecureMessagingTest = () => {
  const { currentIdentity, loading, error } = useIdentity();
  const [recipientId, setRecipientId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<SecureMessage[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Initialize secure messaging when identity is loaded
  useEffect(() => {
    if (currentIdentity && !loading) {
      initializeSecureMessaging();
    }
  }, [currentIdentity, loading]);

  const initializeSecureMessaging = async () => {
    if (!currentIdentity) return;

    try {
      addLog('🔐 Initializing secure messaging...');
      
      // Initialize secure messaging service
      await secureMessagingService.initialize(currentIdentity);
      
      // Set up message handlers
      secureMessagingService.onMessage('text', (message) => {
        addLog(`📨 Received text message from ${message.senderId}`);
        loadConversations();
        if (selectedConversation) {
          loadMessages(selectedConversation.participants[0], selectedConversation.participants[1]);
        }
      });

      // Set up callbacks
      secureMessagingService.setMessageReceivedCallback((message) => {
        addLog(`🔔 New message received: ${message.type} from ${message.senderId}`);
      });

      secureMessagingService.setConversationUpdateCallback((conversation) => {
        addLog(`💬 Conversation updated: ${conversation.id}`);
        loadConversations();
      });

      // Load initial data
      await loadConversations();
      
      // Check for pending messages
      if (currentIdentity) {
        addLog('🔍 Checking for pending messages...');
        await secureMessagingService.checkPendingMessages(currentIdentity.id);
      }
      
      addLog('✅ Secure messaging initialized successfully');
    } catch (error) {
      addLog(`❌ Error initializing secure messaging: ${error}`);
    }
  };

  const loadConversations = async () => {
    try {
      const convos = await secureMessagingService.getConversations();
      setConversations(convos);
      addLog(`📋 Loaded ${convos.length} conversations`);
    } catch (error) {
      addLog(`❌ Error loading conversations: ${error}`);
    }
  };

  const loadMessages = async (participant1: string, participant2: string) => {
    try {
      const msgs = await secureMessagingService.getConversationMessages(participant1, participant2);
      setMessages(msgs);
      addLog(`📨 Loaded ${msgs.length} messages for conversation`);
    } catch (error) {
      addLog(`❌ Error loading messages: ${error}`);
    }
  };

  const sendSecureMessage = async () => {
    if (!recipientId.trim() || !messageText.trim()) {
      addLog('❌ Please enter both recipient ID and message');
      return;
    }

    try {
      addLog(`📤 Sending secure message to ${recipientId}...`);
      
      const messageId = await secureMessagingService.sendSecureMessage(
        recipientId,
        'text',
        { text: messageText }
      );
      
      addLog(`✅ Secure message sent with ID: ${messageId}`);
      setMessageText('');
      
      // Reload conversations and messages
      await loadConversations();
      if (selectedConversation) {
        await loadMessages(selectedConversation.participants[0], selectedConversation.participants[1]);
      }
    } catch (error) {
      addLog(`❌ Error sending secure message: ${error}`);
    }
  };

  const selectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    if (conversation.participants.length === 2) {
      await loadMessages(conversation.participants[0], conversation.participants[1]);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const checkPendingMessages = async () => {
    if (!currentIdentity) return;
    
    addLog('🔍 Manually checking pending messages...');
    await secureMessagingService.checkPendingMessages(currentIdentity.id);
    
    // Reload conversations after checking
    await loadConversations();
    if (selectedConversation) {
      await loadMessages(selectedConversation.participants[0], selectedConversation.participants[1]);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">🔄 Loading...</h2>
            <p className="text-muted-foreground">Initializing secure messaging system</p>
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🔐 Secure P2P Messaging Test</h1>
        <p className="text-muted-foreground">
          Military-grade encrypted messaging with your identity: <strong>{currentIdentity.id}</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Send Message Panel */}
        <Card>
          <CardHeader>
            <CardTitle>📤 Send Secure Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Recipient ID</label>
              <Input
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                placeholder="Enter recipient's ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <Textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Enter your secure message"
                rows={4}
              />
            </div>
            <Button onClick={sendSecureMessage} className="w-full">
              🔐 Send Secure Message
            </Button>
          </CardContent>
        </Card>

        {/* Conversations Panel */}
        <Card>
          <CardHeader>
            <CardTitle>💬 Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {conversations.length === 0 ? (
                <p className="text-muted-foreground text-sm">No conversations yet</p>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedConversation?.id === conversation.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                    onClick={() => selectConversation(conversation)}
                  >
                    <div className="font-medium">
                      {conversation.participants.join(' ↔ ')}
                    </div>
                    {conversation.lastMessage && (
                      <div className="text-sm opacity-80">
                        {conversation.lastMessage.type}: {conversation.lastMessage.timestamp}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            <Button onClick={loadConversations} variant="outline" className="w-full mt-2">
              🔄 Refresh Conversations
            </Button>
            <Button onClick={checkPendingMessages} variant="outline" className="w-full mt-2">
              📨 Check Pending Messages
            </Button>
          </CardContent>
        </Card>

        {/* Messages Panel */}
        <Card>
          <CardHeader>
            <CardTitle>📨 Messages</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedConversation ? (
              <div className="space-y-2">
                {messages.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No messages in this conversation</p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg border ${
                        message.senderId === currentIdentity.id
                          ? 'bg-primary text-primary-foreground ml-4'
                          : 'bg-muted mr-4'
                      }`}
                    >
                      <div className="text-sm opacity-80">
                        {message.senderId} → {message.receiverId}
                      </div>
                      <div className="font-medium">
                        {message.type}: {message.timestamp}
                      </div>
                      <div className="text-xs opacity-60">
                        ID: {message.id.substring(0, 8)}...
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Select a conversation to view messages</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Logs Panel */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>📋 System Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p>No logs yet...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))
            )}
          </div>
          <Button onClick={clearLogs} variant="outline" className="mt-4">
            🗑️ Clear Logs
          </Button>
        </CardContent>
      </Card>

      {/* Security Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>🛡️ Security Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">🔐 Encryption</h4>
              <ul className="text-sm space-y-1">
                <li>• AES-256-GCM for message content</li>
                <li>• PBKDF2 with 100,000 iterations</li>
                <li>• Unique IV for each message</li>
                <li>• Nonce-based replay protection</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">🔗 Transport</h4>
              <ul className="text-sm space-y-1">
                <li>• WebRTC P2P direct connection</li>
                <li>• No central server for message relay</li>
                <li>• End-to-end encryption</li>
                <li>• Digital signatures for authenticity</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecureMessagingTest; 