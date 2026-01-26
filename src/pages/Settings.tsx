import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useUserCategories, useUserMeetingContexts } from "@/hooks/useUserOptions";
import { AppLayout } from "@/components/layout/AppLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { OptionsManager } from "@/components/settings/OptionsManager";
import { supabase } from "@/integrations/supabase/client";
import { exportMultipleToPhone } from "@/lib/export-utils";
import { toast } from "sonner";
import {
  User,
  Bell,
  Shield,
  Share2,
  HelpCircle,
  LogOut,
  ChevronRight,
  Loader2,
  CreditCard,
  Sun,
  Moon,
  Monitor,
  Check,
  Tags,
  MapPin,
  Crown,
  Zap,
} from "lucide-react";

export default function Settings() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading, isAdmin, isTrialActive, getRemainingTrialDays } = useProfile();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [exporting, setExporting] = useState(false);

  const {
    categories,
    loading: categoriesLoading,
    addCategory,
    updateCategory,
    deleteCategory,
    setDefault: setCategoryDefault,
    reorder: reorderCategories,
  } = useUserCategories();

  const {
    contexts,
    loading: contextsLoading,
    addContext,
    updateContext,
    deleteContext,
    setDefault: setContextDefault,
    reorder: reorderContexts,
  } = useUserMeetingContexts();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleExportAll = async () => {
    if (!user) return;
    
    setExporting(true);
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      if (data && data.length > 0) {
        try {
          const success = await exportMultipleToPhone(data);
          if (success) {
            toast.success(`${data.length} contacts ready to save to your phone`);
          } else {
            toast.error("Export cancelled");
          }
        } catch (exportError) {
          console.error('Export failed:', exportError);
          toast.error("Unable to export contacts. Please try again.");
        }
      } else {
        toast.error("No contacts to export");
      }
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export contacts");
    } finally {
      setExporting(false);
    }
  };

  if (authLoading || profileLoading) {
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
      title: "Data & Export",
      items: [
        { 
          icon: Share2, 
          label: "Export All Contacts", 
          description: "Save all contacts to your phone",
          action: handleExportAll,
          loading: exporting,
        },
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

  const trialDays = getRemainingTrialDays();

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <header className="animate-fade-in">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your CardSnap preferences</p>
        </header>

        {/* User Card with Subscription Info */}
        <GlassCard className="animate-slide-up" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-glow">
              <CreditCard className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{user.email}</h3>
              <div className="flex items-center gap-2 mt-1">
                {profile?.subscription_tier === 'free' ? (
                  <>
                    <span className="text-sm text-muted-foreground">Free Plan</span>
                    {isTrialActive() && trialDays > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {trialDays} days trial left
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-primary flex items-center gap-1">
                    <Crown className="h-3.5 w-3.5" />
                    {profile?.subscription_tier === 'pro' ? 'Pro' : 'Business'} Plan
                  </span>
                )}
              </div>
              {profile && (
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {profile.scan_credits} scans left
                  </span>
                  <span>•</span>
                  <span>{profile.total_scans_used} total scans</span>
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Admin Link */}
        {isAdmin && (
          <GlassCard 
            className="animate-slide-up cursor-pointer" 
            style={{ animationDelay: "120ms" }}
            onClick={() => navigate("/admin")}
          >
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-amber-500/10">
                <Crown className="h-5 w-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Admin Dashboard</p>
                <p className="text-sm text-muted-foreground">Manage promo codes and view analytics</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </GlassCard>
        )}

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
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
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

        {/* Custom Categories Section */}
        <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>
          <OptionsManager
            title="Contact Categories"
            description="Customize how you categorize contacts"
            options={categories}
            loading={categoriesLoading}
            onAdd={addCategory}
            onUpdate={updateCategory}
            onDelete={deleteCategory}
            onSetDefault={setCategoryDefault}
            onReorder={reorderCategories}
          />
        </div>

        {/* Custom Meeting Contexts Section */}
        <div className="animate-slide-up" style={{ animationDelay: "250ms" }}>
          <OptionsManager
            title="Meeting Contexts"
            description="Customize where you meet contacts"
            options={contexts}
            loading={contextsLoading}
            onAdd={addContext}
            onUpdate={updateContext}
            onDelete={deleteContext}
            onSetDefault={setContextDefault}
            onReorder={reorderContexts}
          />
        </div>

        {/* Settings Groups */}
        <div className="space-y-6">
          {settingsGroups.map((group, groupIndex) => (
            <section
              key={group.title}
              className="animate-slide-up"
              style={{ animationDelay: `${(groupIndex + 5) * 100}ms` }}
            >
              <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
                {group.title}
              </h2>
              <GlassCard className="divide-y divide-border p-0" hover={false}>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isLoading = 'loading' in item && item.loading;
                  return (
                    <button
                      key={item.label}
                      onClick={'action' in item ? item.action : undefined}
                      disabled={isLoading}
                      className="w-full flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors first:rounded-t-2xl last:rounded-b-2xl disabled:opacity-50"
                    >
                      <div className="p-2 rounded-xl bg-secondary/50">
                        {isLoading ? (
                          <Loader2 className="h-5 w-5 text-foreground animate-spin" />
                        ) : (
                          <Icon className="h-5 w-5 text-foreground" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-foreground">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </button>
                  );
                })}
              </GlassCard>
            </section>
          ))}
        </div>

        {/* Sign Out */}
        <div className="animate-slide-up" style={{ animationDelay: "800ms" }}>
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
