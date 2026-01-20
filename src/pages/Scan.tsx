import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCamera } from "@/hooks/useCamera";
import { supabase } from "@/integrations/supabase/client";
import { CameraOverlay } from "@/components/camera/CameraOverlay";
import { CameraControls } from "@/components/camera/CameraControls";
import { CaptureButton } from "@/components/camera/CaptureButton";
import { Loader2, Camera, AlertCircle, X, Check, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface CapturedCard {
  imageUrl: string;
  imagePath: string;
}

interface LocationData {
  latitude: number | null;
  longitude: number | null;
  city: string;
  country: string;
}

export default function Scan() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  
  // Batch mode state
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [capturedCards, setCapturedCards] = useState<CapturedCard[]>([]);
  
  // Location state - captured once when camera starts
  const [locationData, setLocationData] = useState<LocationData>({
    latitude: null,
    longitude: null,
    city: "",
    country: "",
  });
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const triggerFlash = useCallback(() => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 150);
  }, []);

  // Get location when camera starts
  const getLocation = useCallback(async () => {
    if (!navigator.geolocation) return;

    setIsGettingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;
      setLocationData((prev) => ({
        ...prev,
        latitude,
        longitude,
      }));

      // Reverse geocode to get city/country
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const data = await response.json();
        if (data.address) {
          setLocationData((prev) => ({
            ...prev,
            city: data.address.city || data.address.town || data.address.village || "",
            country: data.address.country || "",
          }));
        }
      } catch (geoError) {
        console.error("Reverse geocoding failed:", geoError);
      }
    } catch (err) {
      console.error("Location error:", err);
    } finally {
      setIsGettingLocation(false);
    }
  }, []);

  const uploadCardImage = useCallback(async (imageData: string): Promise<CapturedCard | null> => {
    if (!user) return null;

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

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("card-images")
        .getPublicUrl(data.path);

      return {
        imageUrl: urlData.publicUrl,
        imagePath: data.path,
      };
    } catch (err) {
      console.error("Upload error:", err);
      throw err;
    }
  }, [user]);

  const handleAutoCapture = useCallback(async (imageData: string) => {
    if (isCapturing || !user) return;
    
    setIsCapturing(true);
    try {
      const cardData = await uploadCardImage(imageData);
      if (!cardData) throw new Error("Failed to upload image");

      if (isBatchMode) {
        // In batch mode, add to queue
        setCapturedCards(prev => [...prev, cardData]);
        toast.success(`Card ${capturedCards.length + 1} captured!`);
        setIsCapturing(false);
      } else {
        // Single mode - navigate to processing
        stopCamera();
        navigate("/processing", {
          state: { 
            imageUrl: cardData.imageUrl, 
            imagePath: cardData.imagePath,
            locationData 
          },
        });
      }
    } catch (err) {
      console.error("Auto-capture error:", err);
      toast.error("Failed to capture image. Please try again.");
      setIsCapturing(false);
    }
  }, [isCapturing, user, isBatchMode, capturedCards.length, uploadCardImage, locationData, navigate]);

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

  // Start camera and get location when component mounts
  useEffect(() => {
    if (user && !cameraStarted) {
      startCamera();
      getLocation();
      setCameraStarted(true);
    }
  }, [user, cameraStarted, startCamera, getLocation]);

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

      const cardData = await uploadCardImage(imageData);
      if (!cardData) throw new Error("Failed to upload image");

      if (isBatchMode) {
        // In batch mode, add to queue
        setCapturedCards(prev => [...prev, cardData]);
        toast.success(`Card ${capturedCards.length + 1} captured!`);
        setIsCapturing(false);
      } else {
        // Single mode - navigate to processing
        stopCamera();
        navigate("/processing", {
          state: { 
            imageUrl: cardData.imageUrl, 
            imagePath: cardData.imagePath,
            locationData 
          },
        });
      }
    } catch (err) {
      console.error("Capture error:", err);
      toast.error("Failed to capture image. Please try again.");
      setIsCapturing(false);
    }
  }, [isCapturing, user, captureImage, stopCamera, navigate, triggerFlash, playShutterSound, isBatchMode, capturedCards.length, uploadCardImage, locationData]);

  const handleRemoveCard = useCallback((index: number) => {
    setCapturedCards(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleProcessBatch = useCallback(() => {
    if (capturedCards.length === 0) {
      toast.error("No cards captured yet");
      return;
    }
    
    stopCamera();
    navigate("/batch-review", {
      state: {
        cards: capturedCards.map(card => ({
          ...card,
          isProcessed: false,
        })),
        locationData,
      },
    });
  }, [capturedCards, locationData, stopCamera, navigate]);

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

      {/* Batch Mode Toggle */}
      {stream && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30">
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm border border-white/20">
            <Label htmlFor="batch-mode" className="text-white text-sm cursor-pointer">
              Single
            </Label>
            <Switch
              id="batch-mode"
              checked={isBatchMode}
              onCheckedChange={setIsBatchMode}
            />
            <Label htmlFor="batch-mode" className="text-white text-sm cursor-pointer flex items-center gap-1">
              <Layers className="h-4 w-4" />
              Batch
            </Label>
          </div>
        </div>
      )}

      {/* Auto-capture status indicator */}
      {stream && !isCapturing && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-30">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white/90 text-xs">
            <div className={`w-2 h-2 rounded-full ${isCardDetected ? 'bg-green-400' : 'bg-amber-400 animate-pulse'}`} />
            {isCountingDown ? (
              <span className="font-medium">Capturing in {countdown}...</span>
            ) : isCardDetected ? (
              <span>Card detected</span>
            ) : (
              <span>Scanning for card...</span>
            )}
          </div>
        </div>
      )}

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

      {/* Batch Mode: Captured Cards Strip */}
      {isBatchMode && capturedCards.length > 0 && (
        <div className="absolute bottom-32 left-0 right-0 z-30 px-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {capturedCards.map((card, index) => (
              <div key={index} className="relative flex-shrink-0">
                <img
                  src={card.imageUrl}
                  alt={`Card ${index + 1}`}
                  className="w-16 h-10 object-cover rounded-lg border-2 border-white/50"
                />
                <button
                  onClick={() => handleRemoveCard(index)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-destructive rounded-full flex items-center justify-center"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
                <span className="absolute bottom-0 left-0 right-0 text-center text-[10px] text-white bg-black/50 rounded-b-lg">
                  {index + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Batch Mode: Process Button */}
      {isBatchMode && capturedCards.length > 0 && (
        <div className="absolute bottom-36 right-4 z-30">
          <Button
            onClick={handleProcessBatch}
            className="gap-2"
            style={{ backgroundColor: "hsl(var(--success))", color: "hsl(var(--success-foreground))" }}
          >
            <Check className="h-4 w-4" />
            Done ({capturedCards.length})
          </Button>
        </div>
      )}

      {/* Location indicator */}
      {isGettingLocation && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-30">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white/70 text-xs">
            <Loader2 className="h-3 w-3 animate-spin" />
            Getting location...
          </div>
        </div>
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
