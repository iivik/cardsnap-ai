import { cn } from "@/lib/utils";

interface CameraOverlayProps {
  className?: string;
  isFocused?: boolean;
  isCountingDown?: boolean;
  countdown?: number;
}

export function CameraOverlay({ 
  className, 
  isFocused = false, 
  isCountingDown = false,
  countdown = 0 
}: CameraOverlayProps) {
  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)}>
      {/* Landscape card frame - centered horizontally with 1.75:1 aspect ratio */}
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div 
          className={cn(
            "relative w-full max-w-md aspect-[1.75] border-2 rounded-2xl transition-colors duration-300",
            isFocused ? "border-green-400" : "border-white/30"
          )}
        >
          {/* Grid lines */}
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/20" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20" />

          {/* Corner brackets */}
          <div className={cn(
            "absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 rounded-tl-lg transition-colors duration-300",
            isFocused ? "border-green-400" : "border-primary"
          )} />
          <div className={cn(
            "absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 rounded-tr-lg transition-colors duration-300",
            isFocused ? "border-green-400" : "border-primary"
          )} />
          <div className={cn(
            "absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 rounded-bl-lg transition-colors duration-300",
            isFocused ? "border-green-400" : "border-primary"
          )} />
          <div className={cn(
            "absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 rounded-br-lg transition-colors duration-300",
            isFocused ? "border-green-400" : "border-primary"
          )} />

          {/* Countdown overlay */}
          {isCountingDown && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-green-500/80 flex items-center justify-center animate-pulse">
                <span className="text-4xl font-bold text-white">{countdown}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hint text */}
      <div className="absolute bottom-32 left-0 right-0 flex justify-center">
        <div className={cn(
          "px-4 py-2 backdrop-blur-sm rounded-full transition-colors duration-300",
          isFocused ? "bg-green-500/50" : "bg-black/50"
        )}>
          <p className="text-white/90 text-sm font-medium">
            {isCountingDown 
              ? "Hold steady..." 
              : isFocused 
                ? "Card detected! Hold steady..." 
                : "Align card horizontally within frame"
            }
          </p>
        </div>
      </div>
    </div>
  );
}
