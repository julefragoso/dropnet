import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { panicMode } from "@/lib/security/panicMode";

interface PanicButtonProps {
  variant?: 'floating' | 'inline';
  className?: string;
}

const PanicButton = ({ variant = 'floating', className = '' }: PanicButtonProps) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handlePanicClick = () => {
    if (!showConfirm) {
      setShowConfirm(true);
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setShowConfirm(false), 3000);
      return;
    }
    
    // Confirm panic mode
    panicMode.manualPanic();
  };

  if (variant === 'floating') {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          variant="destructive"
          size="sm"
          onClick={handlePanicClick}
          className={`
            rounded-full w-12 h-12 p-0 shadow-lg
            ${showConfirm ? 'bg-red-700 animate-pulse' : 'bg-red-600 hover:bg-red-700'}
            transition-all duration-200
          `}
          title={showConfirm ? "Click again to confirm PANIC MODE" : "EMERGENCY PANIC BUTTON"}
        >
          <AlertTriangle className="w-5 h-5" />
        </Button>
        
        {showConfirm && (
          <div className="absolute bottom-16 right-0 bg-red-900 text-white text-xs p-2 rounded shadow-lg whitespace-nowrap">
            🚨 CLICK AGAIN TO ACTIVATE PANIC MODE 🚨
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-block ${className}`}>
      <Button
        variant="destructive"
        size="sm"
        onClick={handlePanicClick}
        className={`
          ${showConfirm ? 'bg-red-700 animate-pulse' : 'bg-red-600 hover:bg-red-700'}
          transition-all duration-200
        `}
      >
        <AlertTriangle className="w-4 h-4 mr-2" />
        {showConfirm ? "CONFIRM PANIC" : "PANIC MODE"}
      </Button>
    </div>
  );
};

export default PanicButton; 