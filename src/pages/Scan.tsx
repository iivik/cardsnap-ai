import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCamera } from "@/hooks/useCamera";
import { supabase } from "@/integrations/supabase/client";
import { CameraOverlay } from "@/components/camera/CameraOverlay";
import { CameraControls } from "@/components/camera/CameraControls";
import { CaptureButton } from "@/components/camera/CaptureButton";
import { Loader2, Camera, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Scan() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

  const triggerFlash = useCallback(() => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 150);
  }, []);

  const handleAutoCapture = useCallback(async (imageData: string) => {
    if (isCapturing || !user) return;
    
    setIsCapturing(true);
    try {
      // Convert base64 to blob
      const response = await fetch(imageData);
      const blob = await response.blob();

      // Generate unique filename
      const filename = `${user.id}/${Date.now()}-card.jpg`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("card-images")
        .upload(filename, blob, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("card-images")
        .getPublicUrl(data.path);

      // Stop camera before navigating
      stopCamera();

      // Navigate to processing page with image URL
      navigate("/processing", {
        state: { imageUrl: urlData.publicUrl, imagePath: data.path },
      });
    } catch (err) {
      console.error("Auto-capture error:", err);
      toast.error("Failed to capture image. Please try again.");
      setIsCapturing(false);
    }
  }, [isCapturing, user, navigate]);

  const {
    videoRef,
    stream,
    error: cameraError,
    isLoading: cameraLoading,
    hasMultipleCameras,
    torchSupported,
    torchOn,
    isCardDetected,
    isCountingDown,
    countdown,
    isMuted,
    startCamera,
    stopCamera,
    flipCamera,
    toggleTorch,
    toggleMute,
    captureImage,
    playShutterSound,
  } = useCamera({
    facingMode: "environment",
    enableAutoCapture: true,
    onAutoCapture: handleAutoCapture,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Start camera when component mounts
  useEffect(() => {
    if (user && !cameraStarted) {
      startCamera();
      setCameraStarted(true);
    }
  }, [user, cameraStarted, startCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleCancel = useCallback(() => {
    stopCamera();
    navigate(-1);
  }, [stopCamera, navigate]);

  const handleCapture = useCallback(async () => {
    if (isCapturing || !user) return;

    setIsCapturing(true);
    
    // Trigger flash and sound
    triggerFlash();
    playShutterSound();

    try {
      // Capture image from video
      const imageData = captureImage();
      if (!imageData) {
        throw new Error("Failed to capture image");
      }

      // Convert base64 to blob
      const response = await fetch(imageData);
      const blob = await response.blob();

      // Generate unique filename
      const filename = `${user.id}/${Date.now()}-card.jpg`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("card-images")
        .upload(filename, blob, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("card-images")
        .getPublicUrl(data.path);

      // Stop camera before navigating
      stopCamera();

      // Navigate to processing page with image URL
      navigate("/processing", {
        state: { imageUrl: urlData.publicUrl, imagePath: data.path },
      });
    } catch (err) {
      console.error("Capture error:", err);
      toast.error("Failed to capture image. Please try again.");
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, user, captureImage, stopCamera, navigate, triggerFlash, playShutterSound]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  // Camera error state
  if (cameraError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
        <div className="text-center space-y-6 max-w-md">
          <div className="p-6 rounded-full bg-destructive/10 inline-block">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">Camera Access Required</h2>
            <p className="text-muted-foreground">{cameraError}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Go Back
            </Button>
            <Button onClick={startCamera}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      {/* Loading state */}
      {cameraLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
          <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="text-white/80">Starting camera...</p>
          </div>
        </div>
      )}

      {/* Flash overlay */}
      {isFlashing && (
        <div className="absolute inset-0 bg-white z-50 animate-flash pointer-events-none" />
      )}

      {/* Video preview */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Camera controls */}
      {stream && (
        <>
          <CameraControls
            onCancel={handleCancel}
            onFlip={flipCamera}
            onToggleTorch={toggleTorch}
            onToggleMute={toggleMute}
            torchOn={torchOn}
            torchSupported={torchSupported}
            hasMultipleCameras={hasMultipleCameras}
            isMuted={isMuted}
            isCapturing={isCapturing}
          />

          <CameraOverlay 
            isFocused={isCardDetected}
            isCountingDown={isCountingDown}
            countdown={countdown}
          />

          <CaptureButton
            onCapture={handleCapture}
            isCapturing={isCapturing}
            disabled={!stream}
          />
        </>
      )}

      {/* Not started state */}
      {!stream && !cameraLoading && !cameraError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Button onClick={startCamera} size="lg" className="gap-2">
            <Camera className="h-5 w-5" />
            Start Camera
          </Button>
        </div>
      )}
    </div>
  );
}
