import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground font-mono flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="max-w-2xl w-full space-y-6 sm:space-y-8">
        {/* ASCII Art Logo */}
        <div className="text-center space-y-4">
          <pre className="text-primary text-xs sm:text-sm md:text-base leading-tight overflow-x-auto">
{`
 ▓█████▄ ▓█████ ▓█████  ██▓███  
 ▒██▀ ██▌▓█   ▀ ▓█   ▀ ▓██░  ██▒
 ░██   █▌▒███   ▒███   ▓██░ ██▓▒
 ░▓█▄   ▌▒▓█  ▄ ▒▓█  ▄ ▒██▄█▓▒ ▒
 ░▒████▓ ░▒████▒░▒████▒▒██▒ ░  ░
  ▒▒▓  ▒ ░░ ▒░ ░░░ ▒░ ░▒▓▒░ ░  ░
  ░ ▒  ▒  ░ ░  ░ ░ ░  ░░▒ ░    
  ░ ░  ░    ░      ░   ░░       
    ░       ░  ░   ░  ░         
  ░                            
   DEEP CONSOLE v1.0           
`}
          </pre>
        </div>

        {/* Main Message */}
        <div className="text-center space-y-4 sm:space-y-6">
          <div className="border-2 border-primary p-4 sm:p-6 bg-card">
            <h1 className="text-xl sm:text-2xl md:text-3xl text-primary font-bold mb-4">
              DEEP CONSOLE v1.0
            </h1>
            <p className="text-base sm:text-lg text-foreground mb-4 sm:mb-6">
              &gt; NO SERVERS. NO TRACES. NO PERMISSION.
            </p>
            <div className="text-xs sm:text-sm text-muted-foreground space-y-2">
              <p>[ ANONYMOUS COMMUNICATION PROTOCOL ]</p>
              <p>[ DECENTRALIZED MESSAGE SYSTEM ]</p>
              <p>[ ZERO-KNOWLEDGE IDENTITY ]</p>
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              variant="terminal"
              size="lg"
              onClick={() => navigate("/onboarding")}
              className="text-lg sm:text-xl px-8 sm:px-12 py-3 sm:py-4 w-full sm:w-auto"
            >
              &gt; ENTER
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground mt-12">
          <p>WARNING: EXPERIMENTAL SOFTWARE</p>
          <p>USE AT YOUR OWN RISK</p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;