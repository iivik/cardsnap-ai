import { Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CaptureButtonProps {
  onCapture: () => void;
  isCapturing: boolean;
  disabled?: boolean;
}

export function CaptureButton({ onCapture, isCapturing, disabled }: CaptureButtonProps) {
  return (
    <div className="absolute bottom-8 left-0 right-0 flex justify-center">
      <button
        onClick={onCapture}
        disabled={disabled || isCapturing}
        className={cn(
          "relative w-20 h-20 rounded-full",
          "bg-gradient-to-br from-primary to-purple-500",
          "shadow-lg shadow-primary/50",
          "flex items-center justify-center",
          "transition-all duration-200",
          "hover:scale-105 active:scale-95",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
          "focus:outline-none focus:ring-4 focus:ring-primary/30"
        )}
      >
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-white/30" />
        
        {/* Inner content */}
        {isCapturing ? (
          <Loader2 className="h-8 w-8 text-white animate-spin" />
        ) : (
          <Camera className="h-8 w-8 text-white" />
        )}
      </button>
    </div>
  );
}
