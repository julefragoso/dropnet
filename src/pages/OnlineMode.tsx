import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const OnlineMode = () => {
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  
  const mockWalletAddress = "0x742d35Cc6C7b3f6E8F4C0cB8b21F7c2b9E43D1a8";

  return (
    <div className="min-h-screen bg-background text-foreground font-mono p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl text-primary font-bold">
            [ WEB3 ONLINE MODE ]
          </h1>
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
          >
            &lt; BACK
          </Button>
        </div>

        {/* Connection Status */}
        <Card className={`border-2 p-6 mb-8 ${
          isConnected ? 'bg-card border-accent' : 'bg-card border-destructive'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold mb-2">
                BLOCKCHAIN CONNECTION STATUS
              </h2>
              <p className={`text-sm ${isConnected ? 'text-accent' : 'text-destructive'}`}>
                {isConnected ? '🟢 CONNECTED TO WEB3' : '🔴 DISCONNECTED'}
              </p>
              {isConnected && (
                <p className="text-xs text-muted-foreground mt-2">
                  WALLET: {mockWalletAddress}
                </p>
              )}
            </div>
            <Button
              variant={isConnected ? "danger" : "info"}
              onClick={() => setIsConnected(!isConnected)}
              className="px-8"
            >
              {isConnected ? 'DISCONNECT' : '> CONNECT WALLET'}
            </Button>
          </div>
        </Card>

        {/* Online Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className={`border-2 border-primary p-6 ${!isConnected && 'opacity-50'}`}>
            <div className="text-center space-y-4">
              <div className="text-4xl">🌐</div>
              <h3 className="text-lg font-bold text-foreground">EXPORT NFTs</h3>
              <p className="text-sm text-muted-foreground">
                Publish your local NFTs to blockchain networks
              </p>
              <Button 
                variant="terminal" 
                disabled={!isConnected}
                className="w-full"
              >
                &gt; EXPORT COLLECTION
              </Button>
            </div>
          </Card>

          <Card className={`border-2 border-primary p-6 ${!isConnected && 'opacity-50'}`}>
            <div className="text-center space-y-4">
              <div className="text-4xl">📡</div>
              <h3 className="text-lg font-bold text-foreground">UPLOAD TO IPFS</h3>
              <p className="text-sm text-muted-foreground">
                Store files on distributed file system
              </p>
              <Button 
                variant="terminal" 
                disabled={!isConnected}
                className="w-full"
              >
                &gt; UPLOAD FILES
              </Button>
            </div>
          </Card>

          <Card className={`border-2 border-primary p-6 ${!isConnected && 'opacity-50'}`}>
            <div className="text-center space-y-4">
              <div className="text-4xl">🔄</div>
              <h3 className="text-lg font-bold text-foreground">SYNC IDENTITY</h3>
              <p className="text-sm text-muted-foreground">
                Backup identity to blockchain with recovery
              </p>
              <Button 
                variant="terminal" 
                disabled={!isConnected}
                className="w-full"
              >
                &gt; SYNC IDENTITY
              </Button>
            </div>
          </Card>

          <Card className={`border-2 border-primary p-6 ${!isConnected && 'opacity-50'}`}>
            <div className="text-center space-y-4">
              <div className="text-4xl">💰</div>
              <h3 className="text-lg font-bold text-foreground">MARKETPLACE</h3>
              <p className="text-sm text-muted-foreground">
                Trade NFTs with other anonymous users
              </p>
              <Button 
                variant="terminal" 
                disabled={!isConnected}
                className="w-full"
              >
                &gt; OPEN MARKET
              </Button>
            </div>
          </Card>
        </div>

        {/* Network Selection */}
        {isConnected && (
          <Card className="bg-card border-2 border-accent p-6">
            <h3 className="text-lg text-accent font-bold mb-4">NETWORK CONFIGURATION</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border border-border rounded">
                <div className="text-2xl mb-2">⟡</div>
                <div className="text-sm font-bold">ETHEREUM</div>
                <div className="text-xs text-muted-foreground">MAINNET</div>
              </div>
              <div className="text-center p-4 border border-border rounded">
                <div className="text-2xl mb-2">◆</div>
                <div className="text-sm font-bold">POLYGON</div>
                <div className="text-xs text-muted-foreground">MATIC</div>
              </div>
              <div className="text-center p-4 border border-border rounded">
                <div className="text-2xl mb-2">◇</div>
                <div className="text-sm font-bold">ARBITRUM</div>
                <div className="text-xs text-muted-foreground">L2</div>
              </div>
            </div>
          </Card>
        )}

        {/* Warning */}
        <div className="mt-8 text-center text-sm text-destructive">
          <p>⚠️ ONLINE MODE REDUCES ANONYMITY</p>
          <p>BLOCKCHAIN TRANSACTIONS ARE PUBLIC</p>
        </div>
      </div>
    </div>
  );
};

export default OnlineMode;