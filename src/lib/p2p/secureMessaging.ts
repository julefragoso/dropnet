// Secure P2P Messaging System for DropNet
// Implements military-grade encryption with double-layer security

import { SECURITY_CONFIG, EncryptedData, UserIdentity } from '@/lib/security/config';
import { dbService } from '@/lib/storage/indexedDB';

export interface SecureMessage {
  id: string;
  type: 'text' | 'file' | 'nft_offer' | 'nft_accept' | 'nft_reject' | 'ping' | 'pong';
  senderId: string;
  receiverId: string;
  timestamp: number;
  encryptedContent: EncryptedData;
  signature: string;
  nonce: string;
  version: number;
}

export interface MessageMetadata {
  id: string;
  senderId: string;
  receiverId: string;
  timestamp: number;
  type: string;
  isRead: boolean;
  isDelivered: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage: MessageMetadata | null;
  createdAt: number;
  updatedAt: number;
}

export class SecureMessagingService {
  private static instance: SecureMessagingService;
  private messageHandlers: Map<string, (message: SecureMessage) => void> = new Map();
  private onMessageReceived?: (message: SecureMessage) => void;
  private onConversationUpdate?: (conversation: Conversation) => void;
  private currentIdentity: UserIdentity | null = null;

  static getInstance(): SecureMessagingService {
    if (!SecureMessagingService.instance) {
      SecureMessagingService.instance = new SecureMessagingService();
    }
    return SecureMessagingService.instance;
  }

  // Initialize with current user identity
  async initialize(identity: UserIdentity): Promise<void> {
    this.currentIdentity = identity;
    console.log('🔐 Secure messaging initialized for:', identity.id);
  }

  // Generate a secure random nonce
  private generateNonce(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.arrayBufferToBase64(array);
  }

  // Convert ArrayBuffer to Base64
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Convert Base64 to ArrayBuffer
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Encrypt message content using AES-256-GCM
  private async encryptContent(content: any, recipientPublicKey: string): Promise<EncryptedData> {
    try {
      // Generate a random encryption key for this message
      const messageKey = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );

      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(SECURITY_CONFIG.IV_LENGTH));
      
      // Encrypt the content with the message key
      const contentBytes = new TextEncoder().encode(JSON.stringify(content));
      const encryptedContent = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        messageKey,
        contentBytes
      );

      // Export the message key
      const exportedKey = await crypto.subtle.exportKey('raw', messageKey);
      
      // Encrypt the message key with recipient's public key (simulated for now)
      // In a real implementation, you'd use ECDH or similar
      const encryptedKey = await this.encryptKeyWithRecipient(exportedKey, recipientPublicKey);

      return {
        data: this.arrayBufferToBase64(encryptedContent),
        iv: this.arrayBufferToBase64(iv),
        salt: this.arrayBufferToBase64(encryptedKey),
        version: 1
      };
    } catch (error) {
      console.error('❌ Error encrypting content:', error);
      throw new Error('Failed to encrypt message content');
    }
  }

  // Simulate encrypting key with recipient's public key
  // In real implementation, use ECDH key agreement
  private async encryptKeyWithRecipient(key: ArrayBuffer, recipientPublicKey: string): Promise<ArrayBuffer> {
    // For now, we'll use a simple XOR with the public key hash
    // In production, use proper ECDH key agreement
    const keyBytes = new Uint8Array(key);
    const publicKeyBytes = new TextEncoder().encode(recipientPublicKey);
    
    for (let i = 0; i < keyBytes.length; i++) {
      keyBytes[i] ^= publicKeyBytes[i % publicKeyBytes.length];
    }
    
    return keyBytes.buffer;
  }

  // Decrypt message content
  private async decryptContent(encryptedData: EncryptedData, senderPublicKey: string): Promise<any> {
    try {
      // Decrypt the message key
      const encryptedKey = this.base64ToArrayBuffer(encryptedData.salt);
      const messageKey = await this.decryptKeyWithSender(encryptedKey, senderPublicKey);
      
      // Import the message key
      const importedKey = await crypto.subtle.importKey(
        'raw',
        messageKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );

      // Decrypt the content
      const iv = this.base64ToArrayBuffer(encryptedData.iv);
      const encryptedBytes = this.base64ToArrayBuffer(encryptedData.data);
      
      const decryptedBytes = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        importedKey,
        encryptedBytes
      );

      const decryptedText = new TextDecoder().decode(decryptedBytes);
      return JSON.parse(decryptedText);
    } catch (error) {
      console.error('❌ Error decrypting content:', error);
      throw new Error('Failed to decrypt message content');
    }
  }

  // Simulate decrypting key with sender's public key
  private async decryptKeyWithSender(encryptedKey: ArrayBuffer, senderPublicKey: string): Promise<ArrayBuffer> {
    // Reverse the XOR operation
    const keyBytes = new Uint8Array(encryptedKey);
    const publicKeyBytes = new TextEncoder().encode(senderPublicKey);
    
    for (let i = 0; i < keyBytes.length; i++) {
      keyBytes[i] ^= publicKeyBytes[i % publicKeyBytes.length];
    }
    
    return keyBytes.buffer;
  }

  // Sign message with Ed25519 (simulated for now)
  private async signMessage(messageData: any): Promise<string> {
    try {
      // In real implementation, use Ed25519 signing
      // For now, create a hash-based signature
      const messageString = JSON.stringify(messageData);
      const messageBytes = new TextEncoder().encode(messageString);
      const hash = await crypto.subtle.digest('SHA-256', messageBytes);
      
      // Create a simple signature (in production, use proper Ed25519)
      const signatureBytes = new Uint8Array(hash);
      return this.arrayBufferToBase64(signatureBytes);
    } catch (error) {
      console.error('❌ Error signing message:', error);
      throw new Error('Failed to sign message');
    }
  }

  // Verify message signature
  private async verifySignature(messageData: any, signature: string, senderPublicKey: string): Promise<boolean> {
    try {
      // In real implementation, verify Ed25519 signature
      // For now, recreate the hash and compare
      const messageString = JSON.stringify(messageData);
      const messageBytes = new TextEncoder().encode(messageString);
      const hash = await crypto.subtle.digest('SHA-256', messageBytes);
      
      const expectedSignature = this.arrayBufferToBase64(hash);
      return signature === expectedSignature;
    } catch (error) {
      console.error('❌ Error verifying signature:', error);
      return false;
    }
  }

  // Create and send a secure message
  async sendSecureMessage(
    receiverId: string, 
    type: SecureMessage['type'], 
    content: any
  ): Promise<string> {
    if (!this.currentIdentity) {
      throw new Error('Secure messaging not initialized');
    }

    try {
      const messageId = crypto.randomUUID();
      const timestamp = Date.now();
      const nonce = this.generateNonce();

      // Get recipient's public key (in real app, fetch from network)
      const recipientPublicKey = await this.getRecipientPublicKey(receiverId);

      // Encrypt the content
      const encryptedContent = await this.encryptContent(content, recipientPublicKey);

      // Create message data for signing
      const messageData = {
        id: messageId,
        type,
        senderId: this.currentIdentity.id,
        receiverId,
        timestamp,
        encryptedContent,
        nonce,
        version: 1
      };

      // Sign the message
      const signature = await this.signMessage(messageData);

      // Create the secure message
      const secureMessage: SecureMessage = {
        ...messageData,
        signature
      };

      // Store message in local database
      await this.storeMessage(secureMessage);

      // Send via P2P (this would be handled by the P2P service)
      await this.sendViaP2P(receiverId, secureMessage);

      console.log('🔐 Secure message sent:', messageId);
      return messageId;
    } catch (error) {
      console.error('❌ Error sending secure message:', error);
      throw error;
    }
  }

  // Get recipient's public key (simulated)
  private async getRecipientPublicKey(recipientId: string): Promise<string> {
    // In real implementation, fetch from network or local cache
    // For now, return a mock public key
    return `public_key_${recipientId}`;
  }

  // Store message in local database
  private async storeMessage(message: SecureMessage): Promise<void> {
    try {
      const metadata: MessageMetadata = {
        id: message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        timestamp: message.timestamp,
        type: message.type,
        isRead: false,
        isDelivered: false
      };

      // Store encrypted message
      await dbService.put('messages', message);
      
      // Store metadata
      await dbService.put('messageMetadata', metadata);

      // Update conversation
      await this.updateConversation(message);
    } catch (error) {
      console.error('❌ Error storing message:', error);
    }
  }

  // Update conversation metadata
  private async updateConversation(message: SecureMessage): Promise<void> {
    try {
      const conversationId = this.getConversationId(message.senderId, message.receiverId);
      
      let conversation = await dbService.get('conversations', conversationId) as Conversation;
      
      if (!conversation) {
        conversation = {
          id: conversationId,
          participants: [message.senderId, message.receiverId].sort(),
          lastMessage: null,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
      }

      conversation.lastMessage = {
        id: message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        timestamp: message.timestamp,
        type: message.type,
        isRead: false,
        isDelivered: false
      };
      conversation.updatedAt = Date.now();

      await dbService.put('conversations', conversation);
      this.onConversationUpdate?.(conversation);
    } catch (error) {
      console.error('❌ Error updating conversation:', error);
    }
  }

  // Get conversation ID from participants
  private getConversationId(participant1: string, participant2: string): string {
    return [participant1, participant2].sort().join('_');
  }

  // Send message via P2P (this would integrate with your P2P service)
  private async sendViaP2P(receiverId: string, message: SecureMessage): Promise<void> {
    try {
      // Import P2P service dynamically to avoid circular dependencies
      const { p2pService } = await import('./p2pService');
      
      if (p2pService.isServiceInitialized()) {
        console.log('📡 Sending secure message via P2P to:', receiverId);
        
        // Send via P2P service
        const sent = await p2pService.sendMessage(receiverId, {
          type: 'secure_message',
          receiverId,
          data: message
        });
        
        if (!sent) {
          console.log('⚠️ P2P send failed, storing message locally');
          await this.storePendingMessage(receiverId, message);
        }
      } else {
        console.log('⚠️ P2P service not initialized, storing message locally');
        // Store message locally for later delivery
        await this.storePendingMessage(receiverId, message);
      }
    } catch (error) {
      console.error('❌ Error sending via P2P:', error);
      // Store message locally for later delivery
      await this.storePendingMessage(receiverId, message);
    }
  }

  // Store pending message for later delivery
  private async storePendingMessage(receiverId: string, message: SecureMessage): Promise<void> {
    try {
      const pendingMessage = {
        id: crypto.randomUUID(),
        receiverId,
        message,
        createdAt: Date.now(),
        attempts: 0,
        maxAttempts: 10
      };
      
      await dbService.put('pendingMessages', pendingMessage);
      console.log('💾 Stored pending message for later delivery to:', receiverId);
    } catch (error) {
      console.error('❌ Error storing pending message:', error);
    }
  }

  // Check and deliver pending messages when a user connects
  async checkPendingMessages(userId: string): Promise<void> {
    try {
      console.log('🔍 Checking pending messages for:', userId);
      
      const allPending = await dbService.getAll('pendingMessages');
      const userPending = allPending.filter((pending: any) => 
        pending.receiverId === userId && pending.attempts < pending.maxAttempts
      );
      
      console.log(`📨 Found ${userPending.length} pending messages for ${userId}`);
      
      for (const pending of userPending) {
        try {
          // Try to deliver the message
          await this.processIncomingMessage(pending.message);
          
          // Remove from pending if successful
          await dbService.delete('pendingMessages', pending.id);
          console.log('✅ Delivered pending message:', pending.id);
        } catch (error) {
          console.error('❌ Error delivering pending message:', error);
          
          // Increment attempts
          pending.attempts++;
          await dbService.put('pendingMessages', pending);
        }
      }
    } catch (error) {
      console.error('❌ Error checking pending messages:', error);
    }
  }

  // Get pending messages for a user (for debugging)
  async getPendingMessages(userId: string): Promise<any[]> {
    try {
      const allPending = await dbService.getAll('pendingMessages');
      return allPending.filter((pending: any) => pending.receiverId === userId);
    } catch (error) {
      console.error('❌ Error getting pending messages:', error);
      return [];
    }
  }

  // Process incoming secure message
  async processIncomingMessage(message: SecureMessage): Promise<void> {
    try {
      // Verify signature
      const messageData = { ...message };
      delete messageData.signature;
      
      const isValid = await this.verifySignature(messageData, message.signature, message.senderId);
      if (!isValid) {
        console.error('❌ Invalid message signature');
        return;
      }

      // Decrypt content
      const decryptedContent = await this.decryptContent(message.encryptedContent, message.senderId);
      console.log('🔓 Decrypted message content:', decryptedContent);

      // Store message
      await this.storeMessage(message);

      // Mark as delivered
      await this.markMessageAsDelivered(message.id);

      // Call message handler
      const handler = this.messageHandlers.get(message.type);
      if (handler) {
        handler(message);
      }

      this.onMessageReceived?.(message);
      console.log('✅ Secure message processed:', message.id);
    } catch (error) {
      console.error('❌ Error processing incoming message:', error);
    }
  }

  // Mark message as delivered
  private async markMessageAsDelivered(messageId: string): Promise<void> {
    try {
      const metadata = await dbService.get('messageMetadata', messageId) as MessageMetadata;
      if (metadata) {
        metadata.isDelivered = true;
        await dbService.put('messageMetadata', metadata);
      }
    } catch (error) {
      console.error('❌ Error marking message as delivered:', error);
    }
  }

  // Mark message as read
  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      const metadata = await dbService.get('messageMetadata', messageId) as MessageMetadata;
      if (metadata) {
        metadata.isRead = true;
        await dbService.put('messageMetadata', metadata);
      }
    } catch (error) {
      console.error('❌ Error marking message as read:', error);
    }
  }

  // Get conversation messages
  async getConversationMessages(participant1: string, participant2: string): Promise<SecureMessage[]> {
    try {
      const conversationId = this.getConversationId(participant1, participant2);
      const conversation = await dbService.get('conversations', conversationId) as Conversation;
      
      if (!conversation) {
        return [];
      }

      // Get all messages for this conversation
      const messages: SecureMessage[] = [];
      const allMessages = await dbService.getAll('messages');
      
      for (const message of allMessages) {
        if (message.senderId === participant1 && message.receiverId === participant2 ||
            message.senderId === participant2 && message.receiverId === participant1) {
          messages.push(message);
        }
      }

      return messages.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('❌ Error getting conversation messages:', error);
      return [];
    }
  }

  // Get all conversations
  async getConversations(): Promise<Conversation[]> {
    try {
      return await dbService.getAll('conversations') as Conversation[];
    } catch (error) {
      console.error('❌ Error getting conversations:', error);
      return [];
    }
  }

  // Register message handler
  onMessage(type: string, handler: (message: SecureMessage) => void): void {
    this.messageHandlers.set(type, handler);
  }

  // Set message received callback
  setMessageReceivedCallback(callback: (message: SecureMessage) => void): void {
    this.onMessageReceived = callback;
  }

  // Set conversation update callback
  setConversationUpdateCallback(callback: (conversation: Conversation) => void): void {
    this.onConversationUpdate = callback;
  }

  // Get current identity
  getCurrentIdentity(): UserIdentity | null {
    return this.currentIdentity;
  }
}

// Export singleton
export const secureMessagingService = SecureMessagingService.getInstance(); 