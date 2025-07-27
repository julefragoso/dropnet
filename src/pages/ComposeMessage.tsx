import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { messageService, MessageDraft } from "@/lib/messages/messageService";
import { nftService } from "@/lib/nft/nftService";
import { dbService } from "@/lib/storage/indexedDB";
import { NFTContent } from "@/lib/nft/types";
import { useCrypto } from "@/hooks/useCrypto";
import { 
  Send, 
  FileText, 
  Image, 
  Package, 
  Shield, 
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";

const ComposeMessage = () => {
  const navigate = useNavigate();
  const [messageType, setMessageType] = useState<'text' | 'file' | 'nft'>('text');
  const [receiverId, setReceiverId] = useState('');
  const [content, setContent] = useState('');
  const [selectedNFT, setSelectedNFT] = useState<string>('');
  const [userNFTs, setUserNFTs] = useState<NFTContent[]>([]);
  const [userIdentity, setUserIdentity] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { generateKeyPair } = useCrypto();

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load user identity
        const identity = await dbService.get('identity', 'current');
        setUserIdentity(identity);

        if (!identity) {
          setError('No user identity found. Please complete onboarding first.');
          return;
        }

        // Load user NFTs
        const nfts = await nftService.getUserNFTs(identity.id);
        setUserNFTs(nfts);

      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load user data');
      }
    };

    loadData();
  }, []);

  const handleSendMessage = async () => {
    if (!userIdentity) {
      setError('No user identity found. Please complete onboarding first.');
      return;
    }

    if (!receiverId.trim() || !content.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsSending(true);
      setError(null);
      setSuccess(null);

      // Generate new key pair for this message
      const keyPair = await generateKeyPair();

      let metadata = undefined;

      // Prepare metadata based on message type
      if (messageType === 'nft' && selectedNFT) {
        const nft = userNFTs.find(n => n.id === selectedNFT);
        if (nft) {
          metadata = {
            nftId: nft.id,
            nftName: nft.metadata.name,
            nftImage: nft.metadata.image
          };
        }
      } else if (messageType === 'file') {
        metadata = {
          fileName: content,
          fileSize: content.length
        };
      }

      // Create and send message
      const message = await messageService.createMessage(
        userIdentity.id,
        receiverId.trim(),
        content,
        messageType,
        metadata,
        keyPair.privateKey
      );

      setSuccess('Message sent successfully!');
      
      // Clear form
      setReceiverId('');
      setContent('');
      setSelectedNFT('');
      setMessageType('text');

      // Navigate back after a short delay
      setTimeout(() => {
        navigate('/messages');
      }, 2000);

    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const getMessagePreview = () => {
    if (messageType === 'nft' && selectedNFT) {
      const nft = userNFTs.find(n => n.id === selectedNFT);
      return nft ? `🎨 NFT: ${nft.metadata.name}` : 'No NFT selected';
    }
    if (messageType === 'file') {
      return `📎 File: ${content || 'No file specified'}`;
    }
    return content || 'No message content';
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-mono p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <h1 className="text-2xl text-primary font-bold">
            [ COMPOSE ENCRYPTED MESSAGE ]
          </h1>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/messages")}
            >
              &lt; BACK
            </Button>
          </div>
        </div>

        {/* Message Form */}
        <Card className="bg-card border-2 border-primary p-8">
          <div className="space-y-6">
            {/* Error/Success Messages */}
            {error && (
              <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500 text-green-500 p-4 rounded flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {success}
              </div>
            )}

            {/* Message Type Selection */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">MESSAGE TYPE:</label>
              <div className="flex gap-2">
                <Button
                  variant={messageType === 'text' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMessageType('text')}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  TEXT
                </Button>
                <Button
                  variant={messageType === 'file' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMessageType('file')}
                  className="flex items-center gap-2"
                >
                  <Image className="w-4 h-4" />
                  FILE
                </Button>
                <Button
                  variant={messageType === 'nft' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMessageType('nft')}
                  className="flex items-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  NFT
                </Button>
              </div>
            </div>

            {/* Receiver ID */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">RECEIVER ID:</label>
              <Input
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value)}
                placeholder="Enter receiver's node ID..."
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the node ID of the person you want to send a message to
              </p>
            </div>

            {/* Content based on message type */}
            {messageType === 'text' && (
              <div>
                <label className="block text-sm text-muted-foreground mb-2">MESSAGE CONTENT:</label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type your encrypted message..."
                  rows={6}
                  className="font-mono"
                  maxLength={1000}
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-muted-foreground">
                    {content.length}/1000 characters
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-3 h-3" />
                    <span>END-TO-END ENCRYPTED</span>
                  </div>
                </div>
              </div>
            )}

            {messageType === 'file' && (
              <div>
                <label className="block text-sm text-muted-foreground mb-2">FILE DESCRIPTION:</label>
                <Input
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Describe the file you're sharing..."
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Note: File sharing is handled through P2P connections
                </p>
              </div>
            )}

            {messageType === 'nft' && (
              <div>
                <label className="block text-sm text-muted-foreground mb-2">SELECT NFT:</label>
                {userNFTs.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-border rounded">
                    <div className="text-4xl mb-4">🎨</div>
                    <p className="text-muted-foreground mb-4">No NFTs available</p>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/nft/create')}
                    >
                      CREATE NFT
                    </Button>
                  </div>
                ) : (
                  <Select value={selectedNFT} onValueChange={setSelectedNFT}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an NFT to share" />
                    </SelectTrigger>
                    <SelectContent>
                      {userNFTs.map((nft) => (
                        <SelectItem key={nft.id} value={nft.id}>
                          <div className="flex items-center gap-2">
                            <img 
                              src={nft.metadata.image} 
                              alt={nft.metadata.name}
                              className="w-6 h-6 object-cover rounded"
                            />
                            {nft.metadata.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Message Preview */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">PREVIEW:</label>
              <Card className="bg-muted border p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">👤</div>
                  <div className="flex-1">
                    <div className="font-bold text-sm">TO: {receiverId || 'Not specified'}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {getMessagePreview()}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {messageType.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        ENCRYPTED
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        SIGNED
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Send Button */}
            <Button
              variant="terminal"
              size="lg"
              onClick={handleSendMessage}
              disabled={isSending || !receiverId.trim() || !content.trim()}
              className="w-full text-lg"
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  SENDING...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  SEND ENCRYPTED MESSAGE
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Security Info */}
        <Card className="bg-card border-2 border-accent p-6 mt-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            SECURITY FEATURES
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>End-to-End Encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Cryptographic Signatures</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Local Storage Only</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>No Server Logs</span>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>MESSAGE WILL BE ENCRYPTED AND SIGNED WITH YOUR PRIVATE KEY</p>
        </div>
      </div>
    </div>
  );
};

export default ComposeMessage;