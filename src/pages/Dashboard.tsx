import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  
  const menuItems = [
    { id: 1, label: "CREATE MESSAGE", route: "/messages/compose", icon: "📝" },
    { id: 2, label: "SEND FILE", route: "/files", icon: "📁" },
    { id: 3, label: "CREATE NFT", route: "/nft/create", icon: "🎨" },
    { id: 4, label: "DROP SPOTS", route: "/drops", icon: "📍" },
    { id: 5, label: "MESSAGES", route: "/messages", icon: "💬" },
    { id: 6, label: "COLLECTION", route: "/collection", icon: "🗃️" },
    { id: 7, label: "ONLINE MODE", route: "/online", icon: "🌐" },
    { id: 8, label: "SETTINGS", route: "/settings", icon: "⚙️" },
  ];

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
                  <span className="block sm:inline">[{item.id}]</span>
                  <span className="block sm:inline sm:ml-1">{item.label}</span>
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
              <div className="text-primary font-bold">3 UNREAD</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-2">NFT COLLECTION:</div>
              <div className="text-primary font-bold">12 ITEMS</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-2">DROP SPOTS:</div>
              <div className="text-primary font-bold">7 NEARBY</div>
            </div>
          </div>
        </Card>

        {/* Footer Commands */}
        <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-muted-foreground">
          <p className="hidden sm:block">TYPE NUMBER [1-8] TO SELECT OPTION | ESC TO EXIT</p>
          <p className="sm:hidden">TAP TO SELECT OPTION</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;