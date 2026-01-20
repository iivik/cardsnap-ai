import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Loader2, Users, CreditCard, TestTube, Ticket, TrendingUp } from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  trialUsers: number;
  promoCodesUsed: number;
  totalScans: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch profiles count
        const { count: totalUsers } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        // Fetch active subscriptions
        const { count: activeSubscriptions } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("subscription_status", "active");

        // Fetch trial users
        const { count: trialUsers } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("subscription_status", "trialing");

        // Fetch promo codes usage
        const { data: promoCodes } = await supabase
          .from("promo_codes")
          .select("current_uses");

        const promoCodesUsed = promoCodes?.reduce((sum, p) => sum + (p.current_uses || 0), 0) || 0;

        // Fetch total scans
        const { data: scansData } = await supabase
          .from("profiles")
          .select("total_scans_used");

        const totalScans = scansData?.reduce((sum, p) => sum + (p.total_scans_used || 0), 0) || 0;

        setStats({
          totalUsers: totalUsers || 0,
          activeSubscriptions: activeSubscriptions || 0,
          trialUsers: trialUsers || 0,
          promoCodesUsed,
          totalScans,
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "text-blue-500" },
    { label: "Active Subscriptions", value: stats?.activeSubscriptions || 0, icon: CreditCard, color: "text-green-500" },
    { label: "Trial Users", value: stats?.trialUsers || 0, icon: TestTube, color: "text-amber-500" },
    { label: "Promo Codes Used", value: stats?.promoCodesUsed || 0, icon: Ticket, color: "text-purple-500" },
    { label: "Total Scans", value: stats?.totalScans || 0, icon: TrendingUp, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Overview</h2>
        <p className="text-muted-foreground">Key metrics and statistics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <GlassCard key={label} className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-secondary/50 ${color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
