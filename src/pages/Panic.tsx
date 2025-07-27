import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const Panic = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (countdown === 0) {
      navigate("/welcome");
    }
  }, [countdown, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-black to-red-900 text-white font-mono flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl text-red-400 font-bold mb-8 animate-pulse">
            🚨 SECURITY BREACH CONTAINED 🚨
          </h1>
        </div>

        <Card className="bg-black/50 border-2 border-red-500 p-8 backdrop-blur-sm">
          <div className="space-y-6 text-center">
            <div className="text-6xl mb-6">🛡️</div>
            
            <h2 className="text-2xl text-red-300 font-bold">
              EMERGENCY PROTOCOL ACTIVATED
            </h2>
            
            <div className="space-y-4 text-sm">
              <p className="text-red-200">
                ✓ ALL SENSITIVE DATA SECURELY ERASED
              </p>
              <p className="text-red-200">
                ✓ MEMORY OVERWRITTEN WITH RANDOM DATA
              </p>
              <p className="text-red-200">
                ✓ ENCRYPTION KEYS DESTROYED
              </p>
              <p className="text-red-200">
                ✓ SESSION TERMINATED
              </p>
            </div>
            
            <div className="border-t border-red-500 pt-4">
              <p className="text-yellow-300 font-bold">
                REDIRECTING TO SAFE ZONE IN: {countdown}
              </p>
            </div>
            
            <div className="text-xs text-gray-400 space-y-2">
              <p>• NO DATA WAS COMPROMISED</p>
              <p>• ALL ENCRYPTION REMAINS INTACT</p>
              <p>• SYSTEM INTEGRITY MAINTAINED</p>
              <p>• YOU CAN SAFELY RESTART</p>
            </div>
            
            <Button
              variant="destructive"
              size="lg"
              onClick={() => navigate("/welcome")}
              className="text-lg px-8 py-3 mt-6"
            >
              &gt; RETURN TO SAFE ZONE
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Panic; 