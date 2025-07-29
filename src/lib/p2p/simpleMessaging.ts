// Simple messaging system for testing between browser tabs
// Uses localStorage to simulate P2P messaging

import { SecureMessage, secureMessagingService } from './secureMessaging';

export interface SimpleMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: number;
  type: 'text' | 'file' | 'nft_offer';
}

export class SimpleMessagingService {
  private static instance: SimpleMessagingService;
  private messageHandlers: Map<string, (message: SimpleMessage) => void> = new Map();
  private onMessageReceived?: (message: SimpleMessage) => void;
  private currentUserId: string = '';
  private storageKey = 'dropnet_simple_messages';
  private broadcastChannel: BroadcastChannel | null = null;

  static getInstance(): SimpleMessagingService {
    if (!SimpleMessagingService.instance) {
      SimpleMessagingService.instance = new SimpleMessagingService();
    }
    return SimpleMessagingService.instance;
  }

  // Initialize with current user ID
  initialize(userId: string): void {
    this.currentUserId = userId;
    console.log('📨 Simple messaging initialized for:', userId);
    
    // Initialize broadcast channel for cross-tab communication
    this.initializeBroadcastChannel();
    
    // Start listening for messages
    this.startMessageListener();
  }

  // Send a simple message
  async sendMessage(receiverId: string, content: string, type: 'text' = 'text'): Promise<string> {
    const message: SimpleMessage = {
      id: crypto.randomUUID(),
      senderId: this.currentUserId,
      receiverId,
      content,
      timestamp: Date.now(),
      type
    };

    // Store message in localStorage
    this.storeMessage(message);
    
    console.log('📤 Simple message sent:', message.id);
    return message.id;
  }

  // Store message in localStorage
  private storeMessage(message: SimpleMessage): void {
    try {
      const existingMessages = this.getStoredMessages();
      existingMessages.push(message);
      
      // Keep only last 100 messages to avoid localStorage overflow
      if (existingMessages.length > 100) {
        existingMessages.splice(0, existingMessages.length - 100);
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(existingMessages));
      
      // Broadcast message to other tabs
      this.broadcastMessage(message);
      
      // Trigger immediate update for current tab
      if (this.onMessageReceived) {
        this.onMessageReceived(message);
      }
    } catch (error) {
      console.error('❌ Error storing simple message:', error);
    }
  }

  // Initialize broadcast channel for cross-tab communication
  private initializeBroadcastChannel(): void {
    try {
      this.broadcastChannel = new BroadcastChannel('dropnet_messages');
      
      this.broadcastChannel.onmessage = (event) => {
        const message = event.data;
        if (message.type === 'new_message' && message.data) {
          console.log('📨 Received broadcast message:', message.data);
          
          // Store the message in localStorage if it's for this user
          if (message.data.receiverId === this.currentUserId || message.data.senderId === this.currentUserId) {
            // Add to localStorage without triggering broadcast again
            const existingMessages = this.getStoredMessages();
            existingMessages.push(message.data);
            
            if (existingMessages.length > 100) {
              existingMessages.splice(0, existingMessages.length - 100);
            }
            
            localStorage.setItem(this.storageKey, JSON.stringify(existingMessages));
            
            // Trigger callback to update UI
            if (this.onMessageReceived) {
              this.onMessageReceived(message.data);
            }
          }
        }
      };
      
      console.log('📡 Broadcast channel initialized');
    } catch (error) {
      console.error('❌ Error initializing broadcast channel:', error);
    }
  }

  // Broadcast message to other tabs
  private broadcastMessage(message: SimpleMessage): void {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'new_message',
          data: message
        });
        console.log('📡 Message broadcasted to other tabs');
      } catch (error) {
        console.error('❌ Error broadcasting message:', error);
      }
    }
  }

  // Get all stored messages
  private getStoredMessages(): SimpleMessage[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Error getting stored messages:', error);
      return [];
    }
  }

  // Get messages for current user
  getMessages(): SimpleMessage[] {
    const allMessages = this.getStoredMessages();
    // Show ALL messages where current user is involved (sender or receiver)
    return allMessages.filter(msg => 
      msg.senderId === this.currentUserId || msg.receiverId === this.currentUserId
    ).sort((a, b) => a.timestamp - b.timestamp);
  }

  // Get conversation messages between two users
  getConversationMessages(user1: string, user2: string): SimpleMessage[] {
    const allMessages = this.getStoredMessages();
    return allMessages.filter(msg => 
      (msg.senderId === user1 && msg.receiverId === user2) ||
      (msg.senderId === user2 && msg.receiverId === user1)
    ).sort((a, b) => a.timestamp - b.timestamp);
  }

  // Start listening for new messages
  private startMessageListener(): void {
    // Check for new messages every 2 seconds
    setInterval(() => {
      this.checkForNewMessages();
    }, 2000);
  }

  // Check for new messages
  private checkForNewMessages(): void {
    const messages = this.getStoredMessages();
    const newMessages = messages.filter(msg => 
      msg.receiverId === this.currentUserId && 
      msg.timestamp > (Date.now() - 5000) // Messages from last 5 seconds
    );

    newMessages.forEach(message => {
      console.log('📨 New simple message received:', message);
      
      // Call message handler
      const handler = this.messageHandlers.get(message.type);
      if (handler) {
        handler(message);
      }

      // Call general callback
      this.onMessageReceived?.(message);
    });
  }

  // Register message handler
  onMessage(type: string, handler: (message: SimpleMessage) => void): void {
    this.messageHandlers.set(type, handler);
  }

  // Set message received callback
  setMessageReceivedCallback(callback: (message: SimpleMessage) => void): void {
    this.onMessageReceived = callback;
  }

  // Clear all messages (for testing)
  clearAllMessages(): void {
    localStorage.removeItem(this.storageKey);
    console.log('🗑️ All simple messages cleared');
  }

  // Get current user ID
  getCurrentUserId(): string {
    return this.currentUserId;
  }
}

// Export singleton
export const simpleMessagingService = SimpleMessagingService.getInstance(); 