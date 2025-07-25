import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const ComposeMessage = () => {
  const navigate = useNavigate();
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  
  const handleSend = () => {
    // Mock send functionality
    alert("Message sent via encrypted channel");
    navigate("/messages");
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-mono p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl text-primary font-bold">
            [ COMPOSE ENCRYPTED MESSAGE ]
          </h1>
          <Button
            variant="outline"
            onClick={() => navigate("/messages")}
          >
            &lt; BACK
          </Button>
        </div>

        <Card className="bg-card border-2 border-primary p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                RECIPIENT NODE ID:
              </label>
              <Input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x742d35Cc6C7b3f6E8F4C0cB8b21F7c2b9E43D1a8"
                className="bg-muted border-border text-foreground font-mono"
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                MESSAGE CONTENT:
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your encrypted message here..."
                rows={8}
                className="bg-muted border-border text-foreground font-mono resize-none"
              />
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              <p>&gt; MESSAGE WILL BE ENCRYPTED END-TO-END</p>
              <p>&gt; NO METADATA STORED</p>
              <p>&gt; UNTRACEABLE ROUTING</p>
            </div>

            <div className="flex gap-4">
              <Button
                variant="terminal"
                onClick={handleSend}
                disabled={!recipient || !message}
                className="flex-1"
              >
                &gt; SEND MESSAGE
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setRecipient("");
                  setMessage("");
                }}
              >
                CLEAR
              </Button>
            </div>
          </div>
        </Card>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>WARNING: ENSURE RECIPIENT ADDRESS IS CORRECT</p>
          <p>MESSAGES CANNOT BE RECALLED ONCE SENT</p>
        </div>
      </div>
    </div>
  );
};

export default ComposeMessage;