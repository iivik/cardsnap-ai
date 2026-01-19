import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  User,
  Bell,
  Shield,
  Download,
  HelpCircle,
  LogOut,
  ChevronRight,
  Loader2,
  CreditCard,
} from "lucide-react";

export default function Settings() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const settingsGroups = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Profile", description: "Manage your account details" },
        { icon: Bell, label: "Notifications", description: "Configure alerts and reminders" },
        { icon: Shield, label: "Privacy & Security", description: "Password and data settings" },
      ],
    },
    {
      title: "Data",
      items: [
        { icon: Download, label: "Export Contacts", description: "Download your CRM data" },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: HelpCircle, label: "Help Center", description: "FAQs and documentation" },
      ],
    },
  ];

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <header className="animate-fade-in">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your CardSnap preferences</p>
        </header>

        {/* User Card */}
        <GlassCard className="animate-slide-up" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-purple-500 shadow-glow">
              <CreditCard className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{user.email}</h3>
              <p className="text-sm text-muted-foreground">Free Plan</p>
            </div>
          </div>
        </GlassCard>

        {/* Settings Groups */}
        <div className="space-y-6">
          {settingsGroups.map((group, groupIndex) => (
            <section
              key={group.title}
              className="animate-slide-up"
              style={{ animationDelay: `${(groupIndex + 2) * 100}ms` }}
            >
              <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
                {group.title}
              </h2>
              <GlassCard className="divide-y divide-white/10 p-0" hover={false}>
                {group.items.map(({ icon: Icon, label, description }) => (
                  <button
                    key={label}
                    className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                  >
                    <div className="p-2 rounded-xl bg-white/10">
                      <Icon className="h-5 w-5 text-foreground" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-foreground">{label}</p>
                      <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>
                ))}
              </GlassCard>
            </section>
          ))}
        </div>

        {/* Sign Out */}
        <div className="animate-slide-up" style={{ animationDelay: "500ms" }}>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
