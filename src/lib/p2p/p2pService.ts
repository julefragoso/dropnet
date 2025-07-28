// P2P Service for DropNet
// Handles direct device-to-device communication using WebRTC

import { io, Socket } from 'socket.io-client';

export interface P2PConnection {
  id: string;
  peerId: string;
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
  isConnected: boolean;
  lastSeen: number;
}

export interface P2PMessage {
  id: string;
  type: 'nft_offer' | 'nft_accept' | 'nft_reject' | 'message' | 'ping' | 'pong' | 'encrypted_message' | 'secure_message';
  senderId: string;
  receiverId: string;
  timestamp: number;
  data: any;
  signature?: string;
}

export interface NFTTransferOffer {
  nftId: string;
  nftData: any;
  offerId: string;
  expiresAt: number;
}

export interface PeerInfo {
  nodeId: string;
  accessCode: string;
}

export class P2PService {
  private static instance: P2PService;
  private connections: Map<string, P2PConnection> = new Map();
  private localPeerId: string = '';
  private localNodeId: string = '';
  private isInitialized: boolean = false;
  private messageHandlers: Map<string, (message: P2PMessage) => void> = new Map();
  private onConnectionChange?: (connections: P2PConnection[]) => void;
  private onPeerListChange?: (peers: PeerInfo[]) => void;
  
  // Socket.io connection to signaling server
  private socket: Socket | null = null;
  private signalingServerUrl: string = process.env.NODE_ENV === 'production' 
    ? 'https://dropnet-signaling.vercel.app' 
    : 'http://localhost:3001';

  // WebRTC configuration
  private rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' }
    ]
  };

  static getInstance(): P2PService {
    if (!P2PService.instance) {
      P2PService.instance = new P2PService();
    }
    return P2PService.instance;
  }

  // Initialize P2P service with real WebRTC
  async initialize(peerId: string, nodeId: string, accessCode: string): Promise<void> {
    if (this.isInitialized) return;

    this.localPeerId = peerId;
    this.localNodeId = nodeId;
    this.isInitialized = true;

    // Connect to signaling server
    await this.connectToSignalingServer(accessCode);
    
    console.log('🔗 P2P Service initialized with real WebRTC');
    console.log('📡 Connected to signaling server');
  }

  // Connect to signaling server
  private async connectToSignalingServer(accessCode: string): Promise<void> {
    try {
      this.socket = io(this.signalingServerUrl);

      this.socket.on('connect', () => {
        console.log('✅ Connected to signaling server');
        console.log('📝 Registering with nodeId:', this.localNodeId);
        
        // Register with the signaling server
        this.socket?.emit('register', {
          nodeId: this.localNodeId,
          accessCode: accessCode
        });
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Disconnected from signaling server');
      });

      // Handle peer list updates
      this.socket.on('peerList', (peers: PeerInfo[]) => {
        console.log('📋 Available peers:', peers);
        console.log('🔍 Current local node ID:', this.localNodeId);
        this.onPeerListChange?.(peers);
        
        // Try to connect to new peers
        peers.forEach(peer => {
          if (peer.nodeId !== this.localNodeId) {
            console.log('🔗 Attempting to connect to peer:', peer.nodeId);
            this.connectToPeer(peer.nodeId);
          } else {
            console.log('⏭️ Skipping self-connection to:', peer.nodeId);
          }
        });
      });

      // Handle WebRTC signaling
      this.socket.on('offer', async (data: { fromNodeId: string; offer: RTCSessionDescriptionInit }) => {
        console.log('📥 Received offer from:', data.fromNodeId);
        await this.handleOffer(data.fromNodeId, data.offer);
      });

      this.socket.on('answer', async (data: { fromNodeId: string; answer: RTCSessionDescriptionInit }) => {
        console.log('📥 Received answer from:', data.fromNodeId);
        await this.handleAnswer(data.fromNodeId, data.answer);
      });

      this.socket.on('iceCandidate', async (data: { fromNodeId: string; candidate: RTCIceCandidateInit }) => {
        console.log('📥 Received ICE candidate from:', data.fromNodeId);
        await this.handleIceCandidate(data.fromNodeId, data.candidate);
      });

      // Request initial peer list
      this.socket.emit('getPeers');

    } catch (error) {
      console.error('❌ Error connecting to signaling server:', error);
    }
  }

  // Connect to a peer using WebRTC
  async connectToPeer(peerNodeId: string): Promise<P2PConnection | null> {
    if (this.connections.has(peerNodeId)) {
      return this.connections.get(peerNodeId)!;
    }

    try {
      console.log('🔗 Initiating connection to peer:', peerNodeId);
      
      const connection = new RTCPeerConnection(this.rtcConfig);
      
      // Create data channel
      const dataChannel = connection.createDataChannel('dropnet', {
        ordered: true
      });

      const p2pConnection: P2PConnection = {
        id: crypto.randomUUID(),
        peerId: peerNodeId,
        connection,
        dataChannel: null,
        isConnected: false,
        lastSeen: Date.now()
      };

      // Set up connection event handlers
      this.setupConnectionHandlers(p2pConnection, dataChannel);

      // Store connection
      this.connections.set(peerNodeId, p2pConnection);

      // Create and send offer
      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);

      // Send offer through signaling server
      this.socket?.emit('offer', {
        targetNodeId: peerNodeId,
        offer: offer
      });

      console.log('📤 Sent offer to peer:', peerNodeId);
      return p2pConnection;
    } catch (error) {
      console.error('❌ Error connecting to peer:', error);
      return null;
    }
  }

  // Handle incoming offer
  private async handleOffer(fromNodeId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    try {
      let connection = this.connections.get(fromNodeId);
      
      if (!connection) {
        // Create new connection for incoming offer
        const rtcConnection = new RTCPeerConnection(this.rtcConfig);
        
        connection = {
          id: crypto.randomUUID(),
          peerId: fromNodeId,
          connection: rtcConnection,
          dataChannel: null,
          isConnected: false,
          lastSeen: Date.now()
        };

        // Set up data channel for incoming connection
        rtcConnection.ondatachannel = (event) => {
          const dataChannel = event.channel;
          this.setupConnectionHandlers(connection!, dataChannel);
        };

        this.connections.set(fromNodeId, connection);
      }

      // Set remote description
      await connection.connection.setRemoteDescription(new RTCSessionDescription(offer));

      // Create and send answer
      const answer = await connection.connection.createAnswer();
      await connection.connection.setLocalDescription(answer);

      // Send answer through signaling server
      this.socket?.emit('answer', {
        targetNodeId: fromNodeId,
        answer: answer
      });

      console.log('📤 Sent answer to peer:', fromNodeId);
    } catch (error) {
      console.error('❌ Error handling offer:', error);
    }
  }

  // Handle incoming answer
  private async handleAnswer(fromNodeId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    try {
      const connection = this.connections.get(fromNodeId);
      if (connection) {
        await connection.connection.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('✅ Answer processed for peer:', fromNodeId);
      }
    } catch (error) {
      console.error('❌ Error handling answer:', error);
    }
  }

  // Handle incoming ICE candidate
  private async handleIceCandidate(fromNodeId: string, candidate: RTCIceCandidateInit): Promise<void> {
    try {
      const connection = this.connections.get(fromNodeId);
      if (connection) {
        await connection.connection.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('✅ ICE candidate added for peer:', fromNodeId);
      }
    } catch (error) {
      console.error('❌ Error handling ICE candidate:', error);
    }
  }

  // Set up connection event handlers
  private setupConnectionHandlers(connection: P2PConnection, dataChannel: RTCDataChannel): void {
    dataChannel.onopen = () => {
      console.log('✅ Data channel opened with peer:', connection.peerId);
      connection.isConnected = true;
      connection.dataChannel = dataChannel;
      this.onConnectionChange?.(Array.from(this.connections.values()));
    };

    dataChannel.onclose = () => {
      console.log('❌ Data channel closed with peer:', connection.peerId);
      connection.isConnected = false;
      connection.dataChannel = null;
      this.onConnectionChange?.(Array.from(this.connections.values()));
    };

    dataChannel.onmessage = (event) => {
      try {
        const message: P2PMessage = JSON.parse(event.data);
        this.handleIncomingMessage(message);
      } catch (error) {
        console.error('❌ Error parsing incoming message:', error);
      }
    };

    connection.connection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate through signaling server
        this.socket?.emit('iceCandidate', {
          targetNodeId: connection.peerId,
          candidate: event.candidate
        });
      }
    };

    connection.connection.onconnectionstatechange = () => {
      console.log('🔄 Connection state changed for', connection.peerId, ':', connection.connection.connectionState);
    };
  }

  // Handle incoming messages
  private handleIncomingMessage(message: P2PMessage): void {
    console.log('📨 Received P2P message:', message);

    // Update last seen
    const connection = this.connections.get(message.senderId);
    if (connection) {
      connection.lastSeen = Date.now();
    }

    // Handle secure messages
    if (message.type === 'secure_message') {
      this.handleSecureMessage(message);
      return;
    }

    // Route message to appropriate handler
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message);
    }
  }

  // Handle incoming secure messages
  private async handleSecureMessage(message: P2PMessage): Promise<void> {
    try {
      console.log('🔐 Processing secure message from:', message.senderId);
      
      // Import secure messaging service dynamically
      const { secureMessagingService } = await import('./secureMessaging');
      
      // Process the secure message
      await secureMessagingService.processIncomingMessage(message.data);
      
      console.log('✅ Secure message processed successfully');
    } catch (error) {
      console.error('❌ Error processing secure message:', error);
    }
  }

  // Send message to peer
  async sendMessage(peerId: string, message: Omit<P2PMessage, 'id' | 'senderId' | 'timestamp'>): Promise<boolean> {
    const connection = this.connections.get(peerId);
    if (!connection || !connection.isConnected || !connection.dataChannel) {
      console.error('❌ No active connection to peer:', peerId);
      return false;
    }

    try {
      const fullMessage: P2PMessage = {
        ...message,
        id: crypto.randomUUID(),
        senderId: this.localNodeId,
        timestamp: Date.now()
      };

      connection.dataChannel.send(JSON.stringify(fullMessage));
      console.log('📤 Sent message to peer:', peerId);
      return true;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      return false;
    }
  }

  // Offer NFT to peer
  async offerNFT(peerId: string, nftData: any): Promise<string> {
    const offerId = crypto.randomUUID();
    const offer: NFTTransferOffer = {
      nftId: nftData.id,
      nftData,
      offerId,
      expiresAt: Date.now() + 300000 // 5 minutes
    };

    const success = await this.sendMessage(peerId, {
      type: 'nft_offer',
      receiverId: peerId,
      data: offer
    });

    return success ? offerId : '';
  }

  // Accept NFT offer
  async acceptNFTOffer(peerId: string, offerId: string): Promise<boolean> {
    return this.sendMessage(peerId, {
      type: 'nft_accept',
      receiverId: peerId,
      data: { offerId }
    });
  }

  // Reject NFT offer
  async rejectNFTOffer(peerId: string, offerId: string): Promise<boolean> {
    return this.sendMessage(peerId, {
      type: 'nft_reject',
      receiverId: peerId,
      data: { offerId }
    });
  }

  // Send text message
  async sendTextMessage(peerId: string, text: string): Promise<boolean> {
    return this.sendMessage(peerId, {
      type: 'message',
      receiverId: peerId,
      data: { text }
    });
  }

  // Register message handler
  onMessage(type: string, handler: (message: P2PMessage) => void): void {
    this.messageHandlers.set(type, handler);
  }

  // Set connection change callback
  onConnectionsChange(callback: (connections: P2PConnection[]) => void): void {
    this.onConnectionChange = callback;
  }

  // Set peer list change callback
  setPeerListChangeCallback(callback: (peers: PeerInfo[]) => void): void {
    this.onPeerListChange = callback;
  }

  // Get all connections
  getConnections(): P2PConnection[] {
    return Array.from(this.connections.values());
  }

  // Get connected peers
  getConnectedPeers(): string[] {
    return Array.from(this.connections.values())
      .filter(conn => conn.isConnected)
      .map(conn => conn.peerId);
  }

  // Check if a peer is connected
  isPeerConnected(peerId: string): boolean {
    const connection = this.connections.get(peerId);
    return connection ? connection.isConnected : false;
  }

  // Disconnect from peer
  disconnectFromPeer(peerId: string): void {
    const connection = this.connections.get(peerId);
    if (connection) {
      connection.connection.close();
      this.connections.delete(peerId);
      this.onConnectionChange?.(Array.from(this.connections.values()));
    }
  }

  // Disconnect from all peers
  disconnectAll(): void {
    this.connections.forEach(connection => {
      connection.connection.close();
    });
    this.connections.clear();
    this.onConnectionChange?.([]);
  }

  // Get local peer ID
  getLocalPeerId(): string {
    return this.localPeerId;
  }

  // Get local node ID
  getLocalNodeId(): string {
    return this.localNodeId;
  }

  // Check if service is initialized
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  // Clean up old connections
  cleanup(): void {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    this.connections.forEach((connection, peerId) => {
      if (now - connection.lastSeen > maxAge) {
        this.disconnectFromPeer(peerId);
      }
    });
  }

  // Request peer list from signaling server
  requestPeerList(): void {
    if (this.socket && this.socket.connected) {
      console.log('📡 Requesting peer list from signaling server...');
      this.socket.emit('getPeers');
    } else {
      console.log('❌ Socket not connected, cannot request peer list');
    }
  }

  // Disconnect from signaling server
  disconnect(): void {
    this.socket?.disconnect();
    this.disconnectAll();
    this.isInitialized = false;
  }
}

// Export singleton
export const p2pService = P2PService.getInstance(); 