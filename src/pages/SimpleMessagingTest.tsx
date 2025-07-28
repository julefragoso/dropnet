import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { simpleMessagingService, SimpleMessage } from '@/lib/p2p/simpleMessaging';

const SimpleMessagingTest = () => {
  const [currentUserId, setCurrentUserId] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<SimpleMessage[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Initialize simple messaging when user ID is set
  useEffect(() => {
    if (currentUserId) {
      initializeSimpleMessaging();
    }
  }, [currentUserId]);

  const initializeSimpleMessaging = async () => {
    if (!currentUserId) return;

    try {
      addLog('📨 Initializing simple messaging...');
      
      // Initialize simple messaging service
      simpleMessagingService.initialize(currentUserId);
      
      // Set up message handlers
      simpleMessagingService.onMessage('text', (message) => {
        addLog(`📨 Received text message from ${message.senderId}: ${message.content}`);
        loadMessages();
      });

      // Set up callbacks
      simpleMessagingService.setMessageReceivedCallback((message) => {
        addLog(`🔔 New message received: ${message.type} from ${message.senderId}`);
        loadMessages();
      });

      // Load initial messages
      await loadMessages();
      
      addLog('✅ Simple messaging initialized successfully');
    } catch (error) {
      addLog(`❌ Error initializing simple messaging: ${error}`);
    }
  };

  const loadMessages = async () => {
    try {
      const msgs = simpleMessagingService.getMessages();
      setMessages(msgs);
      addLog(`📋 Loaded ${msgs.length} messages`);
    } catch (error) {
      addLog(`❌ Error loading messages: ${error}`);
    }
  };

  const sendSimpleMessage = async () => {
    if (!recipientId.trim() || !messageText.trim()) {
      addLog('❌ Please enter both recipient ID and message');
      return;
    }

    try {
      addLog(`📤 Sending simple message to ${recipientId}...`);
      
      const messageId = await simpleMessagingService.sendMessage(
        recipientId,
        messageText
      );
      
      addLog(`✅ Simple message sent with ID: ${messageId}`);
      setMessageText('');
      
      // Reload messages
      await loadMessages();
    } catch (error) {
      addLog(`❌ Error sending simple message: ${error}`);
    }
  };

  const clearAllMessages = () => {
    simpleMessagingService.clearAllMessages();
    setMessages([]);
    addLog('🗑️ All messages cleared');
  };

  const clearLogs = () => {
    setLogs([]);
  };

  // Show user ID input if not set
  if (!currentUserId) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">📝 Enter Your User ID</h2>
            <div className="max-w-md mx-auto space-y-4">
              <Input
                value={currentUserId}
                onChange={(e) => setCurrentUserId(e.target.value)}
                placeholder="Enter your user ID (e.g., ALICE, BOB)"
                className="text-center"
              />
              <Button 
                onClick={() => setCurrentUserId(currentUserId || 'USER_' + Math.random().toString(36).substr(2, 5))}
                className="w-full"
              >
                🚀 Start Messaging
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">📨 Simple Messaging Test</h1>
        <p className="text-muted-foreground">
          Test messaging between browser tabs with your ID: <strong>{currentUserId}</strong>
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          💡 <strong>How to test:</strong> Open this page in two different browser tabs with different user IDs, 
          then send messages between them!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send Message Panel */}
        <Card>
          <CardHeader>
            <CardTitle>📤 Send Message</CardTitle>
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
                placeholder="Enter your message"
                rows={4}
              />
            </div>
            <Button onClick={sendSimpleMessage} className="w-full">
              📤 Send Message
            </Button>
          </CardContent>
        </Card>

        {/* Messages Panel */}
        <Card>
          <CardHeader>
            <CardTitle>📨 Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-muted-foreground text-sm">No messages yet</p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg border ${
                      message.senderId === currentUserId
                        ? 'bg-primary text-primary-foreground ml-4'
                        : 'bg-muted mr-4'
                    }`}
                  >
                    <div className="text-sm opacity-80">
                      {message.senderId} → {message.receiverId}
                    </div>
                    <div className="font-medium">
                      {message.content}
                    </div>
                    <div className="text-xs opacity-60">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex space-x-2 mt-4">
              <Button onClick={loadMessages} variant="outline" className="flex-1">
                🔄 Refresh
              </Button>
              <Button onClick={clearAllMessages} variant="outline" className="flex-1">
                🗑️ Clear All
              </Button>
            </div>
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

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>📖 How to Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">Step 1: Create Two Identities</h4>
              <ol className="list-decimal list-inside text-sm space-y-1 ml-4">
                <li>Open <a href="/onboarding" className="text-primary underline">Onboarding</a> in a new tab</li>
                <li>Create a new identity (e.g., "User1")</li>
                <li>Copy the Access Code and Salt</li>
                <li>Repeat for a second identity (e.g., "User2")</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-semibold">Step 2: Set Up Two Tabs</h4>
              <ol className="list-decimal list-inside text-sm space-y-1 ml-4">
                <li>Open this page in two different browser tabs</li>
                <li>In Tab 1: Set localStorage for User1</li>
                <li>In Tab 2: Set localStorage for User2</li>
                <li>Both should show their respective identities</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-semibold">Step 3: Send Messages</h4>
              <ol className="list-decimal list-inside text-sm space-y-1 ml-4">
                <li>In Tab 1: Send a message to User2's ID</li>
                <li>In Tab 2: You should see the message appear</li>
                <li>Reply from Tab 2 to User1's ID</li>
                <li>Check Tab 1 for the reply</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleMessagingTest; 