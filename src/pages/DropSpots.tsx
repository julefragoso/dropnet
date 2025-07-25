import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const DropSpots = () => {
  const navigate = useNavigate();
  
  const mockDrops = [
    { 
      id: 1, 
      type: "NFT", 
      title: "Digital Artifact #247", 
      distance: "0.2km", 
      creator: "ANON_5643",
      timestamp: "2h ago",
      content: "🎨"
    },
    { 
      id: 2, 
      type: "MESSAGE", 
      title: "Encrypted Note", 
      distance: "0.8km", 
      creator: "GHOST_8821",
      timestamp: "4h ago",
      content: "📝"
    },
    { 
      id: 3, 
      type: "FILE", 
      title: "Anonymous Drop", 
      distance: "1.2km", 
      creator: "CIPHER_9901",
      timestamp: "6h ago",
      content: "📁"
    },
    { 
      id: 4, 
      type: "NFT", 
      title: "Terminal Art Collection", 
      distance: "1.5km", 
      creator: "NODE_3344",
      timestamp: "1d ago",
      content: "🖼️"
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-mono p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl text-primary font-bold">
            [ GEOLOCATION DROP SPOTS ]
          </h1>
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
          >
            &lt; BACK
          </Button>
        </div>

        {/* Location Status */}
        <Card className="bg-card border-2 border-accent p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg text-accent font-bold mb-2">CURRENT POSITION</h2>
              <p className="text-sm text-muted-foreground">
                LAT: 40.7128° N | LON: 74.0060° W
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                SCANNING RADIUS: 2KM | ANONYMOUS MODE: ON
              </p>
            </div>
            <div className="text-4xl text-accent">📡</div>
          </div>
        </Card>

        {/* Drop List */}
        <div className="space-y-4">
          <h2 className="text-lg text-primary font-bold mb-4">
            NEARBY DROPS ({mockDrops.length} DETECTED)
          </h2>
          
          {mockDrops.map((drop) => (
            <Card key={drop.id} className="bg-card border-2 border-primary hover:border-accent transition-colors cursor-pointer">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{drop.content}</div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm bg-muted text-muted-foreground px-2 py-1 uppercase">
                          {drop.type}
                        </span>
                        <span className="text-sm text-destructive">{drop.distance}</span>
                      </div>
                      <h3 className="font-bold text-foreground">{drop.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        By {drop.creator} • {drop.timestamp}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="info" size="sm">
                      VIEW
                    </Button>
                    <Button variant="terminal" size="sm">
                      &gt; COLLECT
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Map Placeholder */}
        <Card className="bg-card border-2 border-primary p-8 mt-8">
          <div className="text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-lg text-muted-foreground mb-2">PROXIMITY MAP</h3>
            <p className="text-sm text-muted-foreground">
              Visual map interface would be rendered here
            </p>
            <div className="mt-4 text-xs text-muted-foreground">
              [MAP RENDERING DISABLED FOR PRIVACY]
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>⚠️ LOCATION DATA ANONYMIZED | NO TRACKING ENABLED</p>
        </div>
      </div>
    </div>
  );
};

export default DropSpots;