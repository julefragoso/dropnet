import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import PanicButton from "@/components/PanicButton";
import { useState, useEffect } from "react";
import { messageService } from "@/lib/messages/messageService";
import { dbService } from "@/lib/storage/indexedDB";

const Dashboard = () => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [nftCount, setNftCount] = useState(0);
  const [dropSpotsCount, setDropSpotsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const menuItems = [
    { id: 1, label: "CREATE MESSAGE", route: "/messages/compose", icon: "📝" },
    { id: 2, label: "SEND FILE", route: "/files", icon: "📁" },
    { id: 3, label: "CREATE NFT", route: "/nft/create", icon: "🎨" },
    { id: 4, label: "DROP SPOTS", route: "/drops", icon: "📍" },
    { id: 5, label: "MESSAGES", route: "/messages", icon: "💬" },
    { id: 6, label: "COLLECTION", route: "/collection", icon: "🗃️" },
    { id: 7, label: "P2P EXCHANGE", route: "/p2p", icon: "📡" },
    { id: 8, label: "SETTINGS", route: "/settings", icon: "⚙️" },
  ];

  // Load real data on component mount
  useEffect(() => {
    const loadSystemStatus = async () => {
      try {
        setLoading(true);
        
        // Load user identity
        const identity = await dbService.get('identity', 'current');
        
        if (identity) {
          // Initialize message service
          await messageService.initialize();
          
          // Get unread message count
          const unread = await messageService.getUnreadCount(identity.id);
          setUnreadCount(unread);
          
          // Get NFT count (placeholder for now)
          const nfts = await dbService.getAll('nfts');
          setNftCount(nfts.length);
          
          // Get drop spots count (placeholder for now)
          const dropSpots = await dbService.getAll('dropSpots');
          setDropSpotsCount(dropSpots.length);
        }
      } catch (error) {
        console.error('Error loading system status:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSystemStatus();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-mono p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-xl sm:text-2xl md:text-3xl text-primary font-bold mb-4">
            DEEP CONSOLE - MAIN TERMINAL
          </h1>
          <div className="text-xs sm:text-sm text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:justify-center gap-1 sm:gap-2">
            <span>NODE STATUS: <span className="text-accent">ONLINE</span></span>
            <span className="hidden sm:inline">|</span>
            <span>IDENTITY: <span className="text-accent">ANONYMOUS</span></span>
            <span className="hidden sm:inline">|</span>
            <span>NETWORK: <span className="text-accent">DECENTRALIZED</span></span>
          </div>
        </div>

        {/* Main Menu Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-12">
          {menuItems.map((item) => (
            <Card key={item.id} className="bg-card border-2 border-primary hover:border-accent transition-colors cursor-pointer">
              <div 
                className="p-3 sm:p-6 text-center space-y-2 sm:space-y-4"
                onClick={() => navigate(item.route)}
              >
                <div className="text-2xl sm:text-4xl">{item.icon}</div>
                <div className="text-xs sm:text-lg font-bold text-foreground">
                  {item.label}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Status */}
        <Card className="bg-card border-2 border-primary p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl text-accent font-bold mb-4">[ SYSTEM STATUS ]</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-sm">
            <div>
              <div className="text-muted-foreground mb-2">MESSAGES:</div>
              <div className="text-primary font-bold">
                {loading ? "LOADING..." : `${unreadCount} UNREAD`}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground mb-2">NFT COLLECTION:</div>
              <div className="text-primary font-bold">
                {loading ? "LOADING..." : `${nftCount} ITEMS`}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground mb-2">DROP SPOTS:</div>
              <div className="text-primary font-bold">
                {loading ? "LOADING..." : `${dropSpotsCount} NEARBY`}
              </div>
            </div>
          </div>
          
          {/* Security Section */}
          <div className="mt-6 pt-4 border-t border-border">
            <h3 className="text-sm text-accent font-bold mb-3">[ SECURITY CONTROLS ]</h3>
            <div className="flex justify-center">
              <PanicButton variant="inline" />
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              EMERGENCY BUTTON - ACTIVATES PANIC MODE
            </p>
          </div>
        </Card>

        {/* Footer Commands */}
        <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-muted-foreground">
          <p className="hidden sm:block">CLICK TO SELECT OPTION</p>
          <p className="sm:hidden">TAP TO SELECT OPTION</p>
        </div>
      </div>
      
      {/* Panic Button - Floating */}
      <PanicButton variant="floating" />
    </div>
  );
};

export default Dashboard;