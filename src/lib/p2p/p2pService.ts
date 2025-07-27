// P2P Service for DropNet
// Handles direct device-to-device communication using WebRTC

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
  type: 'nft_offer' | 'nft_accept' | 'nft_reject' | 'message' | 'ping' | 'pong';
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

export class P2PService {
  private static instance: P2PService;
  private connections: Map<string, P2PConnection> = new Map();
  private localPeerId: string = '';
  private isInitialized: boolean = false;
  private messageHandlers: Map<string, (message: P2PMessage) => void> = new Map();
  private onConnectionChange?: (connections: P2PConnection[]) => void;

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

  // Initialize P2P service
  async initialize(peerId: string): Promise<void> {
    if (this.isInitialized) return;

    this.localPeerId = peerId;
    this.isInitialized = true;

    // Start discovery
    this.startDiscovery();
    
    console.log('P2P Service initialized with peer ID:', peerId);
  }

  // Generate unique peer ID
  generatePeerId(): string {
    return `peer_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  }

  // Start peer discovery
  private startDiscovery(): void {
    // In a real implementation, this would use:
    // - Bluetooth Low Energy (BLE)
    // - Wi-Fi Direct
    // - Local network discovery
    // - QR codes for manual connection
    
    console.log('Starting peer discovery...');
    
    // For now, we'll simulate discovery
    setInterval(() => {
      this.simulatePeerDiscovery();
    }, 10000); // Check every 10 seconds
  }

  // Simulate peer discovery (for demo purposes)
  private simulatePeerDiscovery(): void {
    // In a real app, this would discover actual nearby devices
    const mockPeers = [
      { id: 'peer_1234567890abcdef', name: 'Nearby Device 1' },
      { id: 'peer_abcdef1234567890', name: 'Nearby Device 2' }
    ];

    mockPeers.forEach(peer => {
      if (!this.connections.has(peer.id)) {
        this.connectToPeer(peer.id);
      }
    });
  }

  // Connect to a peer
  async connectToPeer(peerId: string): Promise<P2PConnection | null> {
    if (this.connections.has(peerId)) {
      return this.connections.get(peerId)!;
    }

    try {
      const connection = new RTCPeerConnection(this.rtcConfig);
      
      // Create data channel
      const dataChannel = connection.createDataChannel('dropnet', {
        ordered: true
      });

      const p2pConnection: P2PConnection = {
        id: crypto.randomUUID(),
        peerId,
        connection,
        dataChannel: null,
        isConnected: false,
        lastSeen: Date.now()
      };

      // Set up connection event handlers
      this.setupConnectionHandlers(p2pConnection, dataChannel);

      // Store connection
      this.connections.set(peerId, p2pConnection);

      // Create offer
      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);

      // In a real implementation, you would exchange this offer/answer
      // through a signaling server or direct connection method
      console.log('Connection offer created for peer:', peerId);

      return p2pConnection;
    } catch (error) {
      console.error('Error connecting to peer:', error);
      return null;
    }
  }

  // Set up connection event handlers
  private setupConnectionHandlers(connection: P2PConnection, dataChannel: RTCDataChannel): void {
    dataChannel.onopen = () => {
      console.log('Data channel opened with peer:', connection.peerId);
      connection.isConnected = true;
      connection.dataChannel = dataChannel;
      this.onConnectionChange?.(Array.from(this.connections.values()));
    };

    dataChannel.onclose = () => {
      console.log('Data channel closed with peer:', connection.peerId);
      connection.isConnected = false;
      connection.dataChannel = null;
      this.onConnectionChange?.(Array.from(this.connections.values()));
    };

    dataChannel.onmessage = (event) => {
      try {
        const message: P2PMessage = JSON.parse(event.data);
        this.handleIncomingMessage(message);
      } catch (error) {
        console.error('Error parsing incoming message:', error);
      }
    };

    connection.connection.onicecandidate = (event) => {
      if (event.candidate) {
        // In a real implementation, send this candidate to the peer
        console.log('ICE candidate generated');
      }
    };

    connection.connection.onconnectionstatechange = () => {
      console.log('Connection state changed:', connection.connection.connectionState);
    };
  }

  // Handle incoming messages
  private handleIncomingMessage(message: P2PMessage): void {
    console.log('Received P2P message:', message);

    // Update last seen
    const connection = this.connections.get(message.senderId);
    if (connection) {
      connection.lastSeen = Date.now();
    }

    // Route message to appropriate handler
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message);
    }
  }

  // Send message to peer
  async sendMessage(peerId: string, message: Omit<P2PMessage, 'id' | 'senderId' | 'timestamp'>): Promise<boolean> {
    const connection = this.connections.get(peerId);
    if (!connection || !connection.isConnected || !connection.dataChannel) {
      console.error('No active connection to peer:', peerId);
      return false;
    }

    try {
      const fullMessage: P2PMessage = {
        ...message,
        id: crypto.randomUUID(),
        senderId: this.localPeerId,
        timestamp: Date.now()
      };

      connection.dataChannel.send(JSON.stringify(fullMessage));
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
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
}

// Export singleton
export const p2pService = P2PService.getInstance(); 