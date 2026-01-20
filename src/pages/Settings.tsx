import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
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
  Sun,
  Moon,
  Monitor,
  Check,
} from "lucide-react";

export default function Settings() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

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

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
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
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-glow">
              <CreditCard className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{user.email}</h3>
              <p className="text-sm text-muted-foreground">Free Plan</p>
            </div>
          </div>
        </GlassCard>

        {/* Appearance Section */}
        <section className="animate-slide-up" style={{ animationDelay: "150ms" }}>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
            Appearance
          </h2>
          <GlassCard className="p-0" hover={false}>
            <div className="p-4">
              <p className="font-medium text-foreground mb-3">Theme</p>
              <div className="grid grid-cols-3 gap-3">
                {themeOptions.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                      theme === value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{label}</span>
                    {theme === value && (
                      <Check className="h-4 w-4 absolute top-2 right-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Settings Groups */}
        <div className="space-y-6">
          {settingsGroups.map((group, groupIndex) => (
            <section
              key={group.title}
              className="animate-slide-up"
              style={{ animationDelay: `${(groupIndex + 3) * 100}ms` }}
            >
              <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
                {group.title}
              </h2>
              <GlassCard className="divide-y divide-border p-0" hover={false}>
                {group.items.map(({ icon: Icon, label, description }) => (
                  <button
                    key={label}
                    className="w-full flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                  >
                    <div className="p-2 rounded-xl bg-secondary/50">
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
        <div className="animate-slide-up" style={{ animationDelay: "600ms" }}>
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