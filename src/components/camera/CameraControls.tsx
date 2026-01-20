import { X, Zap, ZapOff, SwitchCamera, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FlashMode = 'auto' | 'on' | 'off';

interface CameraControlsProps {
  onCancel: () => void;
  onFlip: () => void;
  onCycleFlashMode: () => void;
  onToggleMute: () => void;
  flashMode: FlashMode;
  hasMultipleCameras: boolean;
  isMuted: boolean;
  isCapturing?: boolean;
}

export function CameraControls({
  onCancel,
  onFlip,
  onCycleFlashMode,
  onToggleMute,
  flashMode,
  hasMultipleCameras,
  isMuted,
  isCapturing,
}: CameraControlsProps) {
  const getFlashIcon = () => {
    switch (flashMode) {
      case 'on':
        return <Zap className="h-5 w-5 fill-current" />;
      case 'auto':
        return (
          <div className="relative">
            <Zap className="h-5 w-5" />
            <span className="absolute -bottom-1 -right-1 text-[8px] font-bold bg-white text-black rounded px-0.5">A</span>
          </div>
        );
      case 'off':
      default:
        return <ZapOff className="h-5 w-5" />;
    }
  };

  const getFlashButtonClass = () => {
    if (flashMode === 'on') return "bg-primary text-white hover:bg-primary/80";
    if (flashMode === 'auto') return "bg-amber-500/70 text-white hover:bg-amber-500/80";
    return "bg-black/20 text-white hover:bg-white/10";
  };

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
        {/* Mute toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleMute}
          disabled={isCapturing}
          className={cn(
            "rounded-full backdrop-blur-sm",
            isMuted
              ? "bg-destructive/50 text-white hover:bg-destructive/60"
              : "bg-black/20 text-white hover:bg-white/10"
          )}
        >
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </Button>

        {/* Flash mode toggle - always visible */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onCycleFlashMode}
          disabled={isCapturing}
          className={cn(
            "rounded-full backdrop-blur-sm",
            getFlashButtonClass()
          )}
          title={`Flash: ${flashMode.toUpperCase()}`}
        >
          {getFlashIcon()}
        </Button>

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
