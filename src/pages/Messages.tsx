import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const Messages = () => {
  const navigate = useNavigate();
  
  const mockContacts = [
    { id: 1, name: "NODE_7432", status: "online", lastMessage: "Package received", time: "12:45", unread: 2 },
    { id: 2, name: "ANON_9876", status: "offline", lastMessage: "Drop coordinates sent", time: "11:30", unread: 0 },
    { id: 3, name: "GHOST_5543", status: "online", lastMessage: "NFT created successfully", time: "10:15", unread: 1 },
    { id: 4, name: "CIPHER_2109", status: "away", lastMessage: "Meet at location Delta", time: "09:22", unread: 0 },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-mono p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <h1 className="text-xl sm:text-2xl text-primary font-bold">
            [ MESSAGE TERMINAL ]
          </h1>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <Button
              variant="terminal"
              onClick={() => navigate("/messages/compose")}
              className="w-full sm:w-auto text-sm sm:text-base"
            >
              &gt; COMPOSE MESSAGE
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="w-full sm:w-auto text-sm sm:text-base"
            >
              &lt; BACK
            </Button>
          </div>
        </div>

        {/* Contact List */}
        <div className="space-y-4">
          {mockContacts.map((contact) => (
            <Card key={contact.id} className="bg-card border-2 border-primary hover:border-accent transition-colors cursor-pointer">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      contact.status === 'online' ? 'bg-accent' : 
                      contact.status === 'away' ? 'bg-destructive' : 'bg-muted-foreground'
                    }`}></div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-foreground text-sm sm:text-base">{contact.name}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground truncate">{contact.lastMessage}</div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="text-xs sm:text-sm text-muted-foreground">{contact.time}</div>
                    {contact.unread > 0 && (
                      <div className="bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded mt-1 inline-block">
                        {contact.unread}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {mockContacts.length === 0 && (
          <Card className="bg-card border-2 border-primary p-12 text-center">
            <div className="text-4xl mb-4">💬</div>
            <h2 className="text-xl text-muted-foreground mb-4">NO ACTIVE CONVERSATIONS</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Start a new conversation or wait for incoming messages
            </p>
            <Button variant="terminal" onClick={() => navigate("/messages/compose")}>
              &gt; COMPOSE FIRST MESSAGE
            </Button>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>ALL MESSAGES ENCRYPTED | ZERO-KNOWLEDGE PROTOCOL</p>
        </div>
      </div>
    </div>
  );
};

export default Messages;