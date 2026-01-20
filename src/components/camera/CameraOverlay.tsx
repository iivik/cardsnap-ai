import { cn } from "@/lib/utils";

interface CameraOverlayProps {
  className?: string;
}

export function CameraOverlay({ className }: CameraOverlayProps) {
  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)}>
      {/* Grid overlay */}
      <div className="absolute inset-8 border-2 border-white/30 rounded-2xl">
        {/* Vertical lines */}
        <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20" />
        <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/20" />
        
        {/* Horizontal lines */}
        <div className="absolute top-1/3 left-0 right-0 h-px bg-white/20" />
        <div className="absolute top-2/3 left-0 right-0 h-px bg-white/20" />
        
        {/* Corner brackets */}
        <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
        <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
        <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
        <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
      </div>
      
      {/* Scan hint */}
      <div className="absolute bottom-32 left-0 right-0 flex justify-center">
        <div className="px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full">
          <p className="text-white/80 text-sm font-medium">
            Position business card within frame
          </p>
        </div>
      </div>
    </div>
  );
}
