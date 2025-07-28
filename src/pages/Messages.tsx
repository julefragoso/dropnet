import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { messageService, Conversation, Message } from "@/lib/messages/messageService";
import { dbService } from "@/lib/storage/indexedDB";
import { 
  Search, 
  Send, 
  Trash2, 
  Eye, 
  EyeOff, 
  Shield, 
  Clock,
  User,
  MessageSquare,
  Plus
} from "lucide-react";

const Messages = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [userIdentity, setUserIdentity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load data on mount
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true);
        
        // Load user identity
        const identity = await dbService.get('identity', 'current');
        setUserIdentity(identity);

        if (!identity) {
          console.error('No user identity found');
          return;
        }

        // Initialize message service
        await messageService.initialize();

        // Load conversations and unread count
        const userConversations = await messageService.getUserConversations(identity.id);
        const unread = await messageService.getUnreadCount(identity.id);
        
        setConversations(userConversations);
        setUnreadCount(unread);
        
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    // Listen for new messages
    const handleNewMessage = (event: CustomEvent) => {
      console.log('New message received:', event.detail);
      // Refresh conversations when new message arrives
      loadMessages();
    };

    window.addEventListener('newMessage', handleNewMessage as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('newMessage', handleNewMessage as EventListener);
    };
  }, []);

  // Filter conversations based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter(conversation => {
        const lastMessage = conversation.lastMessage;
        if (!lastMessage) return false;
        
        return lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
               lastMessage.senderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
               lastMessage.receiverId.toLowerCase().includes(searchQuery.toLowerCase());
      });
      setFilteredConversations(filtered);
    }
  }, [searchQuery, conversations]);

  const handleConversationClick = (conversation: Conversation) => {
    const otherParticipant = conversation.participants.find(p => p !== userIdentity?.id);
    if (otherParticipant) {
      navigate(`/messages/conversation/${otherParticipant}`);
    }
  };

  const handleDeleteConversation = async (conversation: Conversation) => {
    if (confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      try {
        const otherParticipant = conversation.participants.find(p => p !== userIdentity?.id);
        if (otherParticipant) {
          const success = await messageService.deleteConversation(userIdentity.id, otherParticipant);
          if (success) {
            // Reload conversations
            const updatedConversations = await messageService.getUserConversations(userIdentity.id);
            const updatedUnread = await messageService.getUnreadCount(userIdentity.id);
            setConversations(updatedConversations);
            setUnreadCount(updatedUnread);
          }
        }
      } catch (error) {
        console.error('Error deleting conversation:', error);
      }
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getMessagePreview = (message: Message) => {
    if (message.type === 'file') {
      return `📎 ${message.metadata?.fileName || 'File'}`;
    }
    if (message.type === 'nft') {
      return `🎨 NFT: ${message.metadata?.nftId || 'Unknown'}`;
    }
    return message.content.length > 50 
      ? message.content.substring(0, 50) + '...' 
      : message.content;
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-mono p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl text-primary font-bold">
              [ ENCRYPTED MESSAGES ]
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <Badge variant="secondary">
                {conversations.length} CONVERSATIONS
              </Badge>
              {unreadCount > 0 && (
                <Badge variant="destructive">
                  {unreadCount} UNREAD
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-4">
            <Button
              variant="terminal"
              onClick={() => navigate("/messages/compose")}
            >
              <Plus className="w-4 h-4 mr-2" />
              NEW MESSAGE
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
            >
              &lt; BACK
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card className="bg-card border-2 border-primary p-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Loading State */}
        {loading && (
          <Card className="bg-card border-2 border-primary p-12 text-center">
            <div className="text-4xl mb-4">⏳</div>
            <h2 className="text-xl text-muted-foreground">LOADING MESSAGES...</h2>
          </Card>
        )}

        {/* Conversations List */}
        {!loading && (
          <div className="space-y-4">
            {filteredConversations.length === 0 ? (
              <Card className="bg-card border-2 border-primary p-12 text-center">
                <div className="text-6xl mb-4">💬</div>
                <h2 className="text-xl text-muted-foreground mb-4">
                  {searchQuery ? 'NO MATCHING CONVERSATIONS' : 'NO MESSAGES YET'}
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  {searchQuery 
                    ? 'Try adjusting your search terms'
                    : 'Start a conversation or receive messages from other users'
                  }
                </p>
                <Button 
                  variant="terminal" 
                  onClick={() => navigate("/messages/compose")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  START CONVERSATION
                </Button>
              </Card>
            ) : (
              filteredConversations.map((conversation) => {
                const otherParticipant = conversation.participants.find(p => p !== userIdentity?.id);
                const lastMessage = conversation.lastMessage;
                const isUnread = conversation.unreadCount > 0;

                return (
                  <Card 
                    key={conversation.id} 
                    className={`bg-card border-2 border-primary hover:border-accent transition-colors cursor-pointer ${
                      isUnread ? 'border-accent bg-accent/5' : ''
                    }`}
                    onClick={() => handleConversationClick(conversation)}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="text-2xl">👤</div>
                            <div>
                              <h3 className="font-bold text-foreground">
                                {otherParticipant ? otherParticipant.slice(0, 8) + '...' : 'Unknown'}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Shield className="w-3 h-3" />
                                <span>ENCRYPTED</span>
                                {lastMessage?.signature && (
                                  <>
                                    <span>•</span>
                                    <span>SIGNED</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {lastMessage && (
                            <div className="ml-11">
                              <p className={`text-sm ${isUnread ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                                {getMessagePreview(lastMessage)}
                              </p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>{formatTimestamp(lastMessage.timestamp)}</span>
                                {lastMessage.type !== 'text' && (
                                  <>
                                    <span>•</span>
                                    <span>{lastMessage.type.toUpperCase()}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          {isUnread && (
                            <Badge variant="destructive" className="text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConversation(conversation);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>ALL MESSAGES: END-TO-END ENCRYPTED | CRYPTOGRAPHICALLY SIGNED | LOCAL STORAGE ONLY</p>
        </div>
      </div>
    </div>
  );
};

export default Messages;