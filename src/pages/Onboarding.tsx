import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  // Mock data for identity generation
  const mockPublicKey = "0x742d35Cc6C7b3f6E8F4C0cB8b21F7c2b9E43D1a8";
  const mockAvatar = "🤖";

  if (step === 1) {
    return (
      <div className="min-h-screen bg-background text-foreground font-mono flex flex-col items-center justify-center p-8">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center">
            <h1 className="text-2xl text-primary font-bold mb-8">
              [ IDENTITY GENERATION PROTOCOL ]
            </h1>
          </div>

          <Card className="bg-card border-2 border-primary p-8">
            <div className="text-center space-y-6">
              <div className="text-accent text-6xl mb-6">⚡</div>
              
              <h2 className="text-xl text-foreground">
                GENERATE YOUR ANONYMOUS IDENTITY
              </h2>
              
              <div className="text-sm text-muted-foreground space-y-2">
                <p>&gt; CRYPTOGRAPHICALLY SECURE</p>
                <p>&gt; ZERO PERSONAL DATA REQUIRED</p>
                <p>&gt; UNTRACEABLE BY DESIGN</p>
              </div>
              
              <Button
                variant="info"
                size="lg"
                onClick={() => setStep(2)}
                className="text-lg px-8 py-3 mt-6"
              >
                &gt; GENERATE IDENTITY
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-mono flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-2xl text-primary font-bold mb-8">
            [ IDENTITY GENERATED ]
          </h1>
        </div>

        <Card className="bg-card border-2 border-primary p-8">
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-6xl mb-4">{mockAvatar}</div>
              <h2 className="text-lg text-accent font-bold">ANONYMOUS NODE #{Math.floor(Math.random() * 99999).toString().padStart(5, '0')}</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">PUBLIC KEY:</label>
                <div className="bg-muted border border-border p-3 font-mono text-sm break-all">
                  {mockPublicKey}
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-muted-foreground mb-2">AVATAR:</label>
                <div className="bg-muted border border-border p-3 text-center text-4xl">
                  {mockAvatar}
                </div>
              </div>
            </div>
            
            <div className="text-center space-y-4">
              <div className="text-sm text-destructive">
                ⚠️ SAVE YOUR CREDENTIALS SECURELY
              </div>
              
              <Button
                variant="terminal"
                size="lg"
                onClick={() => navigate("/dashboard")}
                className="text-lg px-8 py-3"
              >
                &gt; CONTINUE
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;