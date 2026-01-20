import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ExtractedData {
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  handwritten_notes: string;
  inferred_country?: string;
  inferred_city?: string;
}

type StepStatus = "pending" | "active" | "complete" | "error";

export default function Processing() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { imageUrl, imagePath, locationData } = (location.state as { 
    imageUrl?: string; 
    imagePath?: string;
    locationData?: { latitude: number | null; longitude: number | null; city: string; country: string };
  }) || {};

  const [steps, setSteps] = useState<{ label: string; status: StepStatus }[]>([
    { label: "Scanning image", status: "active" },
    { label: "Extracting contact info", status: "pending" },
    { label: "Processing data", status: "pending" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const updateStep = (index: number, status: StepStatus) => {
    setSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, status } : step))
    );
  };

  const extractCardData = async () => {
    if (!imageUrl) return;

    setError(null);
    setSteps([
      { label: "Scanning image", status: "active" },
      { label: "Extracting contact info", status: "pending" },
      { label: "Processing data", status: "pending" },
    ]);

    try {
      // Step 1: Scanning image
      await new Promise((resolve) => setTimeout(resolve, 500));
      updateStep(0, "complete");
      updateStep(1, "active");

      // Step 2: Call AI extraction
      const { data, error: fnError } = await supabase.functions.invoke("extract-card", {
        body: { imageUrl },
      });

      if (fnError) {
        throw new Error(fnError.message || "Failed to extract card data");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      updateStep(1, "complete");
      updateStep(2, "active");

      // Step 3: Processing data
      await new Promise((resolve) => setTimeout(resolve, 300));
      updateStep(2, "complete");

      const extractedData: ExtractedData = data?.data || {
        name: "",
        title: "",
        company: "",
        phone: "",
        email: "",
        address: "",
        handwritten_notes: "",
        inferred_country: "",
        inferred_city: "",
      };

      // Also include inferred location from AI
      if (data?.data) {
        extractedData.inferred_country = data.data.inferred_country || "";
        extractedData.inferred_city = data.data.inferred_city || "";
      }

      // Navigate to review page with extracted data
      navigate("/review", {
        state: {
          imageUrl,
          imagePath,
          extractedData,
          locationData,
        },
      });
    } catch (err) {
      console.error("Extraction error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to extract contact information";
      setError(errorMessage);
      toast.error(errorMessage);

      // Mark current active step as error
      setSteps((prev) =>
        prev.map((step) =>
          step.status === "active" ? { ...step, status: "error" } : step
        )
      );
    }
  };

  const handleRetry = () => {
    setIsRetrying(true);
    extractCardData().finally(() => setIsRetrying(false));
  };

  const handleManualEntry = () => {
    navigate("/review", {
      state: {
        imageUrl,
        imagePath,
        extractedData: {
          name: "",
          title: "",
          company: "",
          phone: "",
          email: "",
          address: "",
          handwritten_notes: "",
        },
        locationData,
      },
    });
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (!authLoading && user && !imageUrl) {
      navigate("/scan");
      return;
    }

    if (user && imageUrl) {
      extractCardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, imageUrl]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !imageUrl) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="text-center space-y-8 max-w-md animate-fade-in">
        {/* Image preview */}
        <div className="relative mx-auto w-72 aspect-[1.75] rounded-2xl overflow-hidden shadow-2xl">
          <img
            src={imageUrl}
            alt="Captured card"
            className="w-full h-full object-cover"
          />
          {/* Scanning animation overlay */}
          {!error && (
            <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent">
              <div className="absolute inset-x-0 h-1 bg-primary/80 animate-scan-line" />
            </div>
          )}
        </div>

        {/* Loading indicator */}
        <div className="space-y-4">
          <div className="relative inline-block">
            <div className="p-6 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 backdrop-blur-xl border border-white/10">
              {error ? (
                <AlertCircle className="h-10 w-10 text-destructive" />
              ) : (
                <Sparkles className="h-10 w-10 text-primary animate-pulse" />
              )}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {error ? "Extraction Failed" : "Extracting Contact Details"}
            </h2>
            <p className="text-muted-foreground">
              {error
                ? "We couldn't extract the card information"
                : "Our AI is reading the business card..."}
            </p>
          </div>

          {/* Progress steps */}
          <div className="glass-card p-6 space-y-3">
            {steps.map((step, index) => (
              <ProcessingStep key={index} label={step.label} status={step.status} />
            ))}
          </div>

          {/* Error actions */}
          {error && (
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleManualEntry}>
                Enter Manually
              </Button>
              <Button onClick={handleRetry} disabled={isRetrying} className="gap-2">
                {isRetrying && <Loader2 className="h-4 w-4 animate-spin" />}
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProcessingStep({
  label,
  status,
}: {
  label: string;
  status: StepStatus;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        {status === "complete" && (
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        )}
        {status === "active" && (
          <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
            <Loader2 className="w-3 h-3 text-primary animate-spin" />
          </div>
        )}
        {status === "pending" && (
          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
        )}
        {status === "error" && (
          <div className="w-5 h-5 rounded-full bg-destructive flex items-center justify-center">
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        )}
      </div>
      <span
        className={
          status === "pending"
            ? "text-muted-foreground/50"
            : status === "complete"
            ? "text-muted-foreground"
            : status === "error"
            ? "text-destructive"
            : "text-foreground"
        }
      >
        {label}
      </span>
    </div>
  );
}
