import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { p2pService, P2PConnection, P2PMessage, NFTTransferOffer } from "@/lib/p2p/p2pService";
import { nftService } from "@/lib/nft/nftService";
import { dbService } from "@/lib/storage/indexedDB";
import { NFTContent } from "@/lib/nft/types";
import { 
  Wifi, 
  WifiOff, 
  Users, 
  Send, 
  Download, 
  Upload, 
  MessageSquare, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const P2PExchange = () => {
  const navigate = useNavigate();
  const [connections, setConnections] = useState<P2PConnection[]>([]);
  const [userNFTs, setUserNFTs] = useState<NFTContent[]>([]);
  const [pendingOffers, setPendingOffers] = useState<NFTTransferOffer[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userIdentity, setUserIdentity] = useState<any>(null);
  const [selectedNFT, setSelectedNFT] = useState<string>('');
  const [selectedPeer, setSelectedPeer] = useState<string>('');
  const [messageText, setMessageText] = useState('');
  const [status, setStatus] = useState<string>('Initializing...');

  // Load data on mount
  useEffect(() => {
    const initializeP2P = async () => {
      try {
        // Load user identity
        const identity = await dbService.get('identity', 'current');
        setUserIdentity(identity);

        if (!identity) {
          setStatus('No user identity found. Please complete onboarding first.');
          return;
        }

        // Initialize P2P service
        await p2pService.initialize(identity.nodeId);
        setIsInitialized(true);
        setStatus('P2P service active - Discovering peers...');

        // Load user NFTs
        const nfts = await nftService.getUserNFTs(identity.id);
        setUserNFTs(nfts);

        // Set up P2P event handlers
        setupP2PHandlers();

      } catch (error) {
        console.error('Error initializing P2P:', error);
        setStatus('Failed to initialize P2P service');
      }
    };

    initializeP2P();

    // Cleanup on unmount
    return () => {
      p2pService.disconnectAll();
    };
  }, []);

  // Set up P2P message handlers
  const setupP2PHandlers = () => {
    // Handle NFT offers
    p2pService.onMessage('nft_offer', (message: P2PMessage) => {
      const offer: NFTTransferOffer = message.data;
      setPendingOffers(prev => [...prev, offer]);
      setStatus(`NFT offer received from ${message.senderId.slice(0, 8)}...`);
    });

    // Handle NFT acceptances
    p2pService.onMessage('nft_accept', (message: P2PMessage) => {
      const { offerId } = message.data;
      setPendingOffers(prev => prev.filter(offer => offer.offerId !== offerId));
      setStatus(`NFT transfer accepted by ${message.senderId.slice(0, 8)}...`);
    });

    // Handle NFT rejections
    p2pService.onMessage('nft_reject', (message: P2PMessage) => {
      const { offerId } = message.data;
      setPendingOffers(prev => prev.filter(offer => offer.offerId !== offerId));
      setStatus(`NFT transfer rejected by ${message.senderId.slice(0, 8)}...`);
    });

    // Handle text messages
    p2pService.onMessage('message', (message: P2PMessage) => {
      setStatus(`Message from ${message.senderId.slice(0, 8)}...: ${message.data.text}`);
    });

    // Handle connection changes
    p2pService.onConnectionsChange((newConnections) => {
      setConnections(newConnections);
      const connectedCount = newConnections.filter(conn => conn.isConnected).length;
      setStatus(`Connected to ${connectedCount} peers`);
    });
  };

  // Offer NFT to peer
  const handleOfferNFT = async () => {
    if (!selectedNFT || !selectedPeer) {
      setStatus('Please select both an NFT and a peer');
      return;
    }

    try {
      const nft = userNFTs.find(n => n.id === selectedNFT);
      if (!nft) {
        setStatus('Selected NFT not found');
        return;
      }

      const offerId = await p2pService.offerNFT(selectedPeer, nft);
      if (offerId) {
        setStatus(`NFT offer sent to ${selectedPeer.slice(0, 8)}...`);
        setSelectedNFT('');
        setSelectedPeer('');
      } else {
        setStatus('Failed to send NFT offer');
      }
    } catch (error) {
      console.error('Error offering NFT:', error);
      setStatus('Error offering NFT');
    }
  };

  // Accept NFT offer
  const handleAcceptOffer = async (offer: NFTTransferOffer) => {
    try {
      const success = await p2pService.acceptNFTOffer(offer.nftData.creatorId, offer.offerId);
      if (success) {
        // Add NFT to collection
        await nftService.createNFT({
          name: offer.nftData.metadata.name,
          description: offer.nftData.metadata.description,
          imageFile: null as any, // This would need to be handled properly
          attributes: offer.nftData.metadata.attributes,
          visibility: 'private',
          tags: offer.nftData.tags,
          category: offer.nftData.category
        }, userIdentity.id, '', '');

        setPendingOffers(prev => prev.filter(o => o.offerId !== offer.offerId));
        setStatus('NFT transfer completed successfully');
      } else {
        setStatus('Failed to accept NFT offer');
      }
    } catch (error) {
      console.error('Error accepting NFT offer:', error);
      setStatus('Error accepting NFT offer');
    }
  };

  // Reject NFT offer
  const handleRejectOffer = async (offer: NFTTransferOffer) => {
    try {
      const success = await p2pService.rejectNFTOffer(offer.nftData.creatorId, offer.offerId);
      if (success) {
        setPendingOffers(prev => prev.filter(o => o.offerId !== offer.offerId));
        setStatus('NFT offer rejected');
      }
    } catch (error) {
      console.error('Error rejecting NFT offer:', error);
      setStatus('Error rejecting NFT offer');
    }
  };

  // Send text message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedPeer) {
      setStatus('Please enter a message and select a peer');
      return;
    }

    try {
      const success = await p2pService.sendTextMessage(selectedPeer, messageText);
      if (success) {
        setStatus(`Message sent to ${selectedPeer.slice(0, 8)}...`);
        setMessageText('');
      } else {
        setStatus('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setStatus('Error sending message');
    }
  };

  const connectedPeers = connections.filter(conn => conn.isConnected);

  return (
    <div className="min-h-screen bg-background text-foreground font-mono p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <h1 className="text-2xl text-primary font-bold">
            [ P2P EXCHANGE TERMINAL ]
          </h1>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
            >
              &lt; BACK
            </Button>
          </div>
        </div>

        {/* Status */}
        <Card className="bg-card border-2 border-primary p-4 mb-8">
          <div className="flex items-center gap-3">
            {isInitialized ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
            <div className="flex-1">
              <div className="font-bold">P2P STATUS: {isInitialized ? 'ACTIVE' : 'INACTIVE'}</div>
              <div className="text-sm text-muted-foreground">{status}</div>
            </div>
            <Badge variant={isInitialized ? 'default' : 'secondary'}>
              {connectedPeers.length} PEERS
            </Badge>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Connections & Exchange */}
          <div className="space-y-6">
            {/* Peer Connections */}
            <Card className="bg-card border-2 border-primary p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                PEER CONNECTIONS
              </h2>
              
              {connectedPeers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📡</div>
                  <p className="text-muted-foreground">No peers connected</p>
                  <p className="text-sm text-muted-foreground">Discovering nearby devices...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {connectedPeers.map((connection) => (
                    <div key={connection.id} className="flex items-center justify-between p-3 bg-muted rounded">
                      <div>
                        <div className="font-bold">{connection.peerId.slice(0, 8)}...</div>
                        <div className="text-sm text-muted-foreground">
                          Last seen: {new Date(connection.lastSeen).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant={selectedPeer === connection.peerId ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedPeer(connection.peerId)}
                        >
                          SELECT
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => p2pService.disconnectFromPeer(connection.peerId)}
                        >
                          DISCONNECT
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* NFT Exchange */}
            <Card className="bg-card border-2 border-primary p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                OFFER NFT
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">SELECT NFT:</label>
                  <Select value={selectedNFT} onValueChange={setSelectedNFT}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an NFT to offer" />
                    </SelectTrigger>
                    <SelectContent>
                      {userNFTs.map((nft) => (
                        <SelectItem key={nft.id} value={nft.id}>
                          {nft.metadata.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">SELECT PEER:</label>
                  <Select value={selectedPeer} onValueChange={setSelectedPeer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a peer to offer to" />
                    </SelectTrigger>
                    <SelectContent>
                      {connectedPeers.map((connection) => (
                        <SelectItem key={connection.peerId} value={connection.peerId}>
                          {connection.peerId.slice(0, 8)}...
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="terminal"
                  onClick={handleOfferNFT}
                  disabled={!selectedNFT || !selectedPeer}
                  className="w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  OFFER NFT
                </Button>
              </div>
            </Card>

            {/* Text Messages */}
            <Card className="bg-card border-2 border-primary p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                SEND MESSAGE
              </h2>
              
              <div className="space-y-4">
                <Input
                  placeholder="Type your message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button
                  variant="info"
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || !selectedPeer}
                  className="w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  SEND MESSAGE
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Column - Pending Offers */}
          <div className="space-y-6">
            {/* Pending NFT Offers */}
            <Card className="bg-card border-2 border-primary p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Download className="w-5 h-5" />
                PENDING OFFERS ({pendingOffers.length})
              </h2>
              
              {pendingOffers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📦</div>
                  <p className="text-muted-foreground">No pending offers</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingOffers.map((offer) => (
                    <Card key={offer.offerId} className="bg-muted border p-4">
                      <div className="flex items-start gap-4">
                        <img 
                          src={offer.nftData.metadata.image} 
                          alt={offer.nftData.metadata.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h3 className="font-bold">{offer.nftData.metadata.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            From: {offer.nftData.creatorId.slice(0, 8)}...
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              Expires: {new Date(offer.expiresAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleAcceptOffer(offer)}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRejectOffer(offer)}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>

            {/* Your NFTs */}
            <Card className="bg-card border-2 border-primary p-6">
              <h2 className="text-lg font-bold mb-4">YOUR NFTS ({userNFTs.length})</h2>
              
              {userNFTs.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🎨</div>
                  <p className="text-muted-foreground">No NFTs created yet</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate('/nft/create')}
                  >
                    CREATE NFT
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {userNFTs.slice(0, 6).map((nft) => (
                    <div key={nft.id} className="text-center">
                      <img 
                        src={nft.metadata.image} 
                        alt={nft.metadata.name}
                        className="w-full h-20 object-cover rounded mb-2"
                      />
                      <p className="text-xs font-bold truncate">{nft.metadata.name}</p>
                    </div>
                  ))}
                  {userNFTs.length > 6 && (
                    <div className="text-center">
                      <div className="w-full h-20 bg-muted rounded mb-2 flex items-center justify-center">
                        <span className="text-sm text-muted-foreground">+{userNFTs.length - 6}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">More NFTs</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>P2P COMMUNICATION: DIRECT DEVICE-TO-DEVICE | NO SERVERS REQUIRED</p>
        </div>
      </div>
    </div>
  );
};

export default P2PExchange; 