import { X, Zap, ZapOff, SwitchCamera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CameraControlsProps {
  onCancel: () => void;
  onFlip: () => void;
  onToggleTorch: () => void;
  torchOn: boolean;
  torchSupported: boolean;
  hasMultipleCameras: boolean;
  isCapturing?: boolean;
}

export function CameraControls({
  onCancel,
  onFlip,
  onToggleTorch,
  torchOn,
  torchSupported,
  hasMultipleCameras,
  isCapturing,
}: CameraControlsProps) {
  return (
    <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10">
      {/* Cancel button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onCancel}
        disabled={isCapturing}
        className="text-white hover:bg-white/10 backdrop-blur-sm bg-black/20 rounded-full px-4"
      >
        <X className="h-5 w-5 mr-1" />
        Cancel
      </Button>

      {/* Right controls */}
      <div className="flex gap-2">
        {/* Torch toggle */}
        {torchSupported && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTorch}
            disabled={isCapturing}
            className={cn(
              "rounded-full backdrop-blur-sm",
              torchOn
                ? "bg-primary text-white hover:bg-primary/80"
                : "bg-black/20 text-white hover:bg-white/10"
            )}
          >
            {torchOn ? <Zap className="h-5 w-5" /> : <ZapOff className="h-5 w-5" />}
          </Button>
        )}

        {/* Flip camera */}
        {hasMultipleCameras && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onFlip}
            disabled={isCapturing}
            className="rounded-full backdrop-blur-sm bg-black/20 text-white hover:bg-white/10"
          >
            <SwitchCamera className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
