import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Camera, Zap, Loader2 } from "lucide-react";

export default function Scan() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <AppLayout>
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="relative inline-block">
            <div className="p-8 rounded-3xl bg-gradient-to-br from-primary/20 to-purple-500/20 backdrop-blur-xl border border-white/10">
              <Camera className="h-20 w-20 text-primary" />
            </div>
            <div className="absolute -top-3 -right-3 p-3 rounded-full bg-gradient-to-br from-primary to-purple-500 shadow-glow animate-pulse">
              <Zap className="h-5 w-5 text-white" />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Camera Coming Soon</h2>
            <p className="text-muted-foreground max-w-xs mx-auto">
              The AI-powered card scanner will be available in the next update
            </p>
          </div>

          <div className="glass-card p-6 max-w-md mx-auto">
            <h3 className="font-semibold text-foreground mb-3">What to expect:</h3>
            <ul className="text-sm text-muted-foreground space-y-2 text-left">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Point your camera at any business card
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                AI extracts name, company, email & phone
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Auto-saves location and meeting context
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Batch scan multiple cards at once
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
