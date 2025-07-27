// Message Service for DropNet
// Handles encrypted messages with cryptographic verification

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'file' | 'nft' | 'system';
  timestamp: number;
  signature: string;
  isRead: boolean;
  isEncrypted: boolean;
  metadata?: {
    fileName?: string;
    fileSize?: number;
    nftId?: string;
    replyTo?: string;
  };
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage: Message | null;
  unreadCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface MessageDraft {
  receiverId: string;
  content: string;
  type: 'text' | 'file' | 'nft';
  metadata?: any;
}

export class MessageService {
  private static instance: MessageService;
  private isInitialized: boolean = false;

  static getInstance(): MessageService {
    if (!MessageService.instance) {
      MessageService.instance = new MessageService();
    }
    return MessageService.instance;
  }

  // Initialize message service
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;
    console.log('Message Service initialized');
  }

  // Create a new message
  async createMessage(
    senderId: string,
    receiverId: string,
    content: string,
    type: 'text' | 'file' | 'nft' = 'text',
    metadata?: any,
    privateKey?: string
  ): Promise<Message> {
    try {
      const message: Message = {
        id: crypto.randomUUID(),
        senderId,
        receiverId,
        content,
        type,
        timestamp: Date.now(),
        signature: '',
        isRead: false,
        isEncrypted: true,
        metadata
      };

      // Sign message if private key provided
      if (privateKey) {
        const contentToSign = JSON.stringify({
          id: message.id,
          senderId: message.senderId,
          receiverId: message.receiverId,
          content: message.content,
          timestamp: message.timestamp
        });
        
        // Import private key and sign
        const privateKeyBuffer = this.base64ToArrayBuffer(privateKey);
        const cryptoKey = await crypto.subtle.importKey(
          'pkcs8',
          privateKeyBuffer,
          { name: 'Ed25519', namedCurve: 'Ed25519' },
          false,
          ['sign']
        );

        const encoder = new TextEncoder();
        const signature = await crypto.subtle.sign(
          { name: 'Ed25519' },
          cryptoKey,
          encoder.encode(contentToSign)
        );

        message.signature = this.arrayBufferToBase64(signature);
      }

      // Store message in encrypted database
      await dbService.put('messages', message);

      // Update conversation
      await this.updateConversation(senderId, receiverId, message);

      return message;
    } catch (error) {
      console.error('Error creating message:', error);
      throw new Error('Failed to create message');
    }
  }

  // Get messages for a conversation
  async getConversationMessages(userId1: string, userId2: string): Promise<Message[]> {
    try {
      const allMessages = await dbService.getAll('messages');
      
      return allMessages.filter(message => 
        (message.senderId === userId1 && message.receiverId === userId2) ||
        (message.senderId === userId2 && message.receiverId === userId1)
      ).sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      return [];
    }
  }

  // Get all conversations for a user
  async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
      const allMessages = await dbService.getAll('messages');
      const conversations = new Map<string, Conversation>();

      // Group messages by conversation
      allMessages.forEach(message => {
        if (message.senderId === userId || message.receiverId === userId) {
          const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
          const conversationId = [userId, otherUserId].sort().join('_');

          if (!conversations.has(conversationId)) {
            conversations.set(conversationId, {
              id: conversationId,
              participants: [userId, otherUserId],
              lastMessage: null,
              unreadCount: 0,
              createdAt: message.timestamp,
              updatedAt: message.timestamp
            });
          }

          const conversation = conversations.get(conversationId)!;
          
          // Update last message
          if (!conversation.lastMessage || message.timestamp > conversation.lastMessage.timestamp) {
            conversation.lastMessage = message;
            conversation.updatedAt = message.timestamp;
          }

          // Count unread messages
          if (message.receiverId === userId && !message.isRead) {
            conversation.unreadCount++;
          }
        }
      });

      return Array.from(conversations.values()).sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
      console.error('Error getting user conversations:', error);
      return [];
    }
  }

  // Mark message as read
  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      const message = await dbService.get('messages', messageId);
      if (message) {
        message.isRead = true;
        await dbService.put('messages', message);
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  // Mark conversation as read
  async markConversationAsRead(userId1: string, userId2: string): Promise<void> {
    try {
      const messages = await this.getConversationMessages(userId1, userId2);
      const unreadMessages = messages.filter(msg => 
        msg.receiverId === userId1 && !msg.isRead
      );

      for (const message of unreadMessages) {
        await this.markMessageAsRead(message.id);
      }
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  }

  // Delete message
  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      await dbService.delete('messages', messageId);
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  }

  // Delete conversation
  async deleteConversation(userId1: string, userId2: string): Promise<boolean> {
    try {
      const messages = await this.getConversationMessages(userId1, userId2);
      
      for (const message of messages) {
        await dbService.delete('messages', message.id);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }
  }

  // Verify message signature
  async verifyMessage(message: Message, publicKey: string): Promise<boolean> {
    try {
      if (!message.signature) return false;

      const contentToVerify = JSON.stringify({
        id: message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        timestamp: message.timestamp
      });

      const publicKeyBuffer = this.base64ToArrayBuffer(publicKey);
      const cryptoKey = await crypto.subtle.importKey(
        'spki',
        publicKeyBuffer,
        { name: 'Ed25519', namedCurve: 'Ed25519' },
        false,
        ['verify']
      );

      const encoder = new TextEncoder();
      const signatureBuffer = this.base64ToArrayBuffer(message.signature);

      return await crypto.subtle.verify(
        { name: 'Ed25519' },
        cryptoKey,
        signatureBuffer,
        encoder.encode(contentToVerify)
      );
    } catch (error) {
      console.error('Error verifying message:', error);
      return false;
    }
  }

  // Search messages
  async searchMessages(userId: string, query: string): Promise<Message[]> {
    try {
      const allMessages = await dbService.getAll('messages');
      const userMessages = allMessages.filter(message => 
        message.senderId === userId || message.receiverId === userId
      );

      return userMessages.filter(message => 
        message.content.toLowerCase().includes(query.toLowerCase())
      ).sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error searching messages:', error);
      return [];
    }
  }

  // Get unread count for user
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const allMessages = await dbService.getAll('messages');
      return allMessages.filter(message => 
        message.receiverId === userId && !message.isRead
      ).length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Update conversation metadata
  private async updateConversation(senderId: string, receiverId: string, message: Message): Promise<void> {
    try {
      const conversationId = [senderId, receiverId].sort().join('_');
      const conversations = await dbService.getAll('conversations');
      let conversation = conversations.find(c => c.id === conversationId);

      if (!conversation) {
        conversation = {
          id: conversationId,
          participants: [senderId, receiverId],
          lastMessage: message,
          unreadCount: 0,
          createdAt: message.timestamp,
          updatedAt: message.timestamp
        };
      } else {
        conversation.lastMessage = message;
        conversation.updatedAt = message.timestamp;
        if (message.receiverId === receiverId) {
          conversation.unreadCount++;
        }
      }

      await dbService.put('conversations', conversation);
    } catch (error) {
      console.error('Error updating conversation:', error);
    }
  }

  // Utility functions
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Check if service is initialized
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }
}

// Import dbService
import { dbService } from '@/lib/storage/indexedDB';

// Export singleton
export const messageService = MessageService.getInstance(); 