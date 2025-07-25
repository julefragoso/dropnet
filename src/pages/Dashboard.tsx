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
    <div className="min-h-screen bg-background text-foreground font-mono p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl text-primary font-bold mb-4">
            DEEP CONSOLE - MAIN TERMINAL
          </h1>
          <div className="text-sm text-muted-foreground">
            NODE STATUS: <span className="text-accent">ONLINE</span> | 
            IDENTITY: <span className="text-accent">ANONYMOUS</span> | 
            NETWORK: <span className="text-accent">DECENTRALIZED</span>
          </div>
        </div>

        {/* Main Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {menuItems.map((item) => (
            <Card key={item.id} className="bg-card border-2 border-primary hover:border-accent transition-colors cursor-pointer">
              <div 
                className="p-6 text-center space-y-4"
                onClick={() => navigate(item.route)}
              >
                <div className="text-4xl">{item.icon}</div>
                <div className="text-lg font-bold text-foreground">
                  [{item.id}] {item.label}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Status */}
        <Card className="bg-card border-2 border-primary p-6">
          <h2 className="text-xl text-accent font-bold mb-4">[ SYSTEM STATUS ]</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
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
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>TYPE NUMBER [1-8] TO SELECT OPTION | ESC TO EXIT</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;