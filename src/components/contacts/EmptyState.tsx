import { CreditCard, Camera, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="relative mb-6">
        <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/20 to-purple-500/20 backdrop-blur-xl border border-white/10">
          <CreditCard className="h-16 w-16 text-primary" />
        </div>
        <div className="absolute -top-2 -right-2 p-2 rounded-full bg-gradient-to-br from-primary to-purple-500 shadow-glow animate-pulse">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
      </div>

      <h3 className="text-xl font-semibold text-foreground mb-2">No contacts yet</h3>
      <p className="text-muted-foreground mb-6 max-w-xs">
        Scan your first business card to get started with your AI-powered CRM
      </p>

      <Link to="/scan" className="gradient-button inline-flex items-center gap-2">
        <Camera className="h-5 w-5" />
        Scan Your First Card
      </Link>
    </div>
  );
}
