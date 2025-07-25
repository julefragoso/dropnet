import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const Collection = () => {
  const navigate = useNavigate();
  
  const mockNFTs = [
    { 
      id: 1, 
      title: "Terminal Genesis #001", 
      type: "CREATED", 
      date: "2024-01-15",
      content: "🎨",
      size: "2.4KB",
      status: "LOCAL"
    },
    { 
      id: 2, 
      title: "Anonymous Message Art", 
      type: "RECEIVED", 
      date: "2024-01-14",
      content: "📝",
      size: "1.8KB",
      status: "LOCAL"
    },
    { 
      id: 3, 
      title: "Decentralized Manifesto", 
      type: "CREATED", 
      date: "2024-01-12",
      content: "📜",
      size: "5.2KB",
      status: "EXPORTED"
    },
    { 
      id: 4, 
      title: "Crypto Punk Remix", 
      type: "RECEIVED", 
      date: "2024-01-10",
      content: "🤖",
      size: "12.1KB",
      status: "LOCAL"
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-mono p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl text-primary font-bold">
            [ NFT COLLECTION MANAGER ]
          </h1>
          <div className="flex gap-4">
            <Button
              variant="terminal"
              onClick={() => navigate("/nft/create")}
            >
              &gt; CREATE NEW
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
            >
              &lt; BACK
            </Button>
          </div>
        </div>

        {/* Stats */}
        <Card className="bg-card border-2 border-accent p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl text-primary font-bold">12</div>
              <div className="text-sm text-muted-foreground">TOTAL ITEMS</div>
            </div>
            <div>
              <div className="text-2xl text-accent font-bold">8</div>
              <div className="text-sm text-muted-foreground">CREATED</div>
            </div>
            <div>
              <div className="text-2xl text-destructive font-bold">4</div>
              <div className="text-sm text-muted-foreground">RECEIVED</div>
            </div>
            <div>
              <div className="text-2xl text-foreground font-bold">2</div>
              <div className="text-sm text-muted-foreground">EXPORTED</div>
            </div>
          </div>
        </Card>

        {/* Collection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockNFTs.map((nft) => (
            <Card key={nft.id} className="bg-card border-2 border-primary hover:border-accent transition-colors">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{nft.content}</div>
                  <div className="flex gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      nft.type === 'CREATED' ? 'bg-accent text-accent-foreground' : 'bg-destructive text-destructive-foreground'
                    }`}>
                      {nft.type}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      nft.status === 'EXPORTED' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {nft.status}
                    </span>
                  </div>
                </div>
                
                <h3 className="font-bold text-foreground mb-2">{nft.title}</h3>
                
                <div className="text-sm text-muted-foreground space-y-1 mb-4">
                  <p>SIZE: {nft.size}</p>
                  <p>DATE: {nft.date}</p>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="info" size="sm" className="flex-1">
                    VIEW
                  </Button>
                  <Button variant="terminal" size="sm">
                    EXPORT
                  </Button>
                  <Button variant="danger" size="sm">
                    DELETE
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {mockNFTs.length === 0 && (
          <Card className="bg-card border-2 border-primary p-12 text-center">
            <div className="text-6xl mb-4">🗃️</div>
            <h2 className="text-xl text-muted-foreground mb-4">COLLECTION EMPTY</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Create your first NFT or collect from drop spots
            </p>
            <Button variant="terminal" onClick={() => navigate("/nft/create")}>
              &gt; CREATE FIRST NFT
            </Button>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>LOCAL STORAGE: ENCRYPTED | BACKUP RECOMMENDED</p>
        </div>
      </div>
    </div>
  );
};

export default Collection;