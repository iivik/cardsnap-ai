import { useState, useRef, useCallback, useEffect } from "react";

interface UseCameraOptions {
  facingMode?: "user" | "environment";
  enableAutoCapture?: boolean;
  onAutoCapture?: (imageData: string) => void;
}

export function useCamera(options: UseCameraOptions = {}) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    options.facingMode || "environment"
  );
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [flashMode, setFlashMode] = useState<'auto' | 'on' | 'off'>('off');
  const [isCardDetected, setIsCardDetected] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastFrameRef = useRef<ImageData | null>(null);
  const stabilityCountRef = useRef(0);
  const autoCaptureTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const enableAutoCapture = options.enableAutoCapture ?? true;
  const onAutoCapture = options.onAutoCapture;

  // Play shutter sound using Web Audio API
  const playShutterSound = useCallback(() => {
    if (isMuted) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      // Create a short click sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (err) {
      console.error("Failed to play shutter sound:", err);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const checkCameraCapabilities = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === "videoinput");
      setHasMultipleCameras(videoDevices.length > 1);
    } catch (err) {
      console.error("Failed to enumerate devices:", err);
    }
  }, []);

  // Analyze frame for stability (detect when card is in focus)
  const analyzeFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !enableAutoCapture) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx || video.videoWidth === 0) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current frame
    ctx.drawImage(video, 0, 0);

    // Get center region (where the card should be)
    const centerX = canvas.width * 0.15;
    const centerY = canvas.height * 0.3;
    const regionWidth = canvas.width * 0.7;
    const regionHeight = canvas.height * 0.4;

    const currentFrame = ctx.getImageData(centerX, centerY, regionWidth, regionHeight);

    // Calculate edge detection (Laplacian variance for sharpness)
    let edgeSum = 0;
    const data = currentFrame.data;
    for (let i = 0; i < data.length; i += 16) { // Sample every 4th pixel for performance
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      edgeSum += gray;
    }

    // Check for stability (compare with last frame)
    if (lastFrameRef.current) {
      const lastData = lastFrameRef.current.data;
      let diff = 0;
      const sampleSize = Math.min(data.length, lastData.length);
      
      for (let i = 0; i < sampleSize; i += 64) {
        diff += Math.abs(data[i] - lastData[i]);
      }

      const avgDiff = diff / (sampleSize / 64);
      const isStable = avgDiff < 35; // Threshold for stability (more forgiving detection)
      const hasContent = edgeSum > 3000; // Threshold for detecting content (lowered for better detection)

      if (isStable && hasContent) {
        stabilityCountRef.current++;
        
        // Card detected after 2 stable frames (~600ms)
        if (stabilityCountRef.current >= 2 && !isCardDetected) {
          setIsCardDetected(true);
        }
        
        // Start countdown after 3 stable frames (~900ms)
        if (stabilityCountRef.current === 3 && !isCountingDown && onAutoCapture) {
          setIsCountingDown(true);
          setCountdown(3);
          
          let count = 3;
          countdownIntervalRef.current = setInterval(() => {
            count--;
            setCountdown(count);
            
            if (count === 0) {
              if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
              }
              // Play shutter sound before capturing
              playShutterSound();
              // Trigger auto-capture
              const imageData = captureImage();
              if (imageData && onAutoCapture) {
                onAutoCapture(imageData);
              }
              setIsCountingDown(false);
              setIsCardDetected(false);
              stabilityCountRef.current = 0;
            }
          }, 1000);
        }
      } else {
        // Reset if unstable
        stabilityCountRef.current = 0;
        setIsCardDetected(false);
        setIsCountingDown(false);
        setCountdown(0);
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
      }
    }

    lastFrameRef.current = currentFrame;
  }, [enableAutoCapture, isCardDetected, isCountingDown, onAutoCapture, playShutterSound]);

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Stop any existing stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);

      // Check torch support
      const videoTrack = mediaStream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
      setTorchSupported(!!capabilities?.torch);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Create canvas for frame analysis
      if (!canvasRef.current) {
        canvasRef.current = document.createElement("canvas");
      }

      // Start frame analysis for auto-capture
      if (enableAutoCapture) {
        analysisIntervalRef.current = setInterval(analyzeFrame, 300);
      }
    } catch (err) {
      console.error("Camera error:", err);
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError("Camera access denied. Please allow camera access in your browser settings.");
        } else if (err.name === "NotFoundError") {
          setError("No camera found on this device.");
        } else {
          setError(`Failed to access camera: ${err.message}`);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [facingMode, stream, enableAutoCapture, analyzeFrame]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    
    // Clean up intervals
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (autoCaptureTimeoutRef.current) {
      clearTimeout(autoCaptureTimeoutRef.current);
      autoCaptureTimeoutRef.current = null;
    }
    
    // Reset state
    setIsCardDetected(false);
    setIsCountingDown(false);
    setCountdown(0);
    stabilityCountRef.current = 0;
    lastFrameRef.current = null;
  }, [stream]);

  const flipCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }, []);

  const cycleFlashMode = useCallback(() => {
    setFlashMode(prev => {
      if (prev === 'off') return 'auto';
      if (prev === 'auto') return 'on';
      return 'off';
    });
  }, []);

  // Apply torch state based on flash mode
  const applyTorch = useCallback(async (on: boolean) => {
    if (!stream || !torchSupported) return;
    try {
      const videoTrack = stream.getVideoTracks()[0];
      await videoTrack.applyConstraints({
        advanced: [{ torch: on } as MediaTrackConstraintSet],
      });
    } catch (err) {
      console.error("Failed to toggle torch:", err);
    }
  }, [stream, torchSupported]);

  // Keep torch on when flash mode is 'on'
  useEffect(() => {
    if (flashMode === 'on') {
      applyTorch(true);
    } else if (flashMode === 'off') {
      applyTorch(false);
    }
    // 'auto' mode: torch is off by default, will flash during capture
  }, [flashMode, applyTorch]);

  const captureImage = useCallback((): string | null => {
    if (!videoRef.current) return null;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Calculate the card region (same as CameraOverlay)
    // Business card aspect ratio: 1.75:1 (standard business card)
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    // Card region: 85% width, centered, aspect ratio 1.75:1
    const cardWidth = videoWidth * 0.85;
    const cardHeight = cardWidth / 1.75;
    const cardX = (videoWidth - cardWidth) / 2;
    const cardY = (videoHeight - cardHeight) / 2;

    // Set canvas to card dimensions (landscape)
    canvas.width = cardWidth;
    canvas.height = cardHeight;

    // Draw only the card region (cropped to business card area)
    ctx.drawImage(
      video,
      cardX, cardY, cardWidth, cardHeight,  // Source region
      0, 0, cardWidth, cardHeight            // Destination
    );

    return canvas.toDataURL("image/jpeg", 0.9);
  }, []);

  useEffect(() => {
    checkCameraCapabilities();
  }, [checkCameraCapabilities]);

  // Restart camera when facing mode changes
  useEffect(() => {
    if (stream) {
      startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [stream]);

  return {
    videoRef,
    stream,
    error,
    isLoading,
    facingMode,
    hasMultipleCameras,
    torchSupported,
    flashMode,
    isCardDetected,
    isCountingDown,
    countdown,
    isMuted,
    startCamera,
    stopCamera,
    flipCamera,
    cycleFlashMode,
    applyTorch,
    toggleMute,
    captureImage,
    playShutterSound,
  };
}
