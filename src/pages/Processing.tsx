import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Sparkles, ScanLine } from "lucide-react";

export default function Processing() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { imageUrl, imagePath } = (location.state as { imageUrl?: string; imagePath?: string }) || {};

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    // If no image URL, go back to scan
    if (!authLoading && user && !imageUrl) {
      navigate("/scan");
    }
  }, [user, authLoading, navigate, imageUrl]);

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
        <div className="relative mx-auto w-64 h-40 rounded-2xl overflow-hidden shadow-2xl">
          <img
            src={imageUrl}
            alt="Captured card"
            className="w-full h-full object-cover"
          />
          {/* Scanning animation overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent">
            <div className="absolute inset-x-0 h-1 bg-primary/80 animate-scan-line" />
          </div>
        </div>

        {/* Loading indicator */}
        <div className="space-y-4">
          <div className="relative inline-block">
            <div className="p-6 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 backdrop-blur-xl border border-white/10">
              <Sparkles className="h-10 w-10 text-primary animate-pulse" />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Analyzing Business Card
            </h2>
            <p className="text-muted-foreground">
              Our AI is extracting contact information...
            </p>
          </div>

          {/* Progress steps */}
          <div className="glass-card p-6 space-y-3">
            <ProcessingStep label="Scanning image" status="complete" />
            <ProcessingStep label="Detecting text" status="active" />
            <ProcessingStep label="Extracting contact info" status="pending" />
            <ProcessingStep label="Validating data" status="pending" />
          </div>
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
  status: "pending" | "active" | "complete";
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
      </div>
      <span
        className={
          status === "pending"
            ? "text-muted-foreground/50"
            : status === "complete"
            ? "text-muted-foreground"
            : "text-foreground"
        }
      >
        {label}
      </span>
    </div>
  );
}
