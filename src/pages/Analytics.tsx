import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/analytics/StatCard";
import { CategoryChart } from "@/components/analytics/CategoryChart";
import { RoleBreakdown } from "@/components/analytics/RoleBreakdown";
import { LocationTree } from "@/components/analytics/LocationTree";
import { WordCloud } from "@/components/analytics/WordCloud";
import { DrillDownModal } from "@/components/analytics/DrillDownModal";
import {
  Users,
  Globe,
  MapPin,
  Briefcase,
  Loader2,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import {
  aggregateLocations,
  aggregateRoles,
  aggregateCategories,
  CATEGORY_LABELS,
  type LocationStats,
  type RoleStats,
  type CategoryStats,
} from "@/lib/analytics-utils";

interface Contact {
  id: string;
  name: string;
  title: string | null;
  company: string;
  email: string;
  category: string | null;
  location_city: string | null;
  location_country: string | null;
  created_at: string;
}

export default function Analytics() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Drill-down state
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownTitle, setDrillDownTitle] = useState("");
  const [drillDownSubtitle, setDrillDownSubtitle] = useState("");
  const [drillDownContacts, setDrillDownContacts] = useState<Contact[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchContacts();
    }
  }, [user]);

  const fetchContacts = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("id, name, title, company, email, category, location_city, location_country, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (err) {
      console.error("Error fetching contacts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Computed analytics data
  const locationStats = useMemo(() => aggregateLocations(contacts), [contacts]);
  const roleStats = useMemo(() => aggregateRoles(contacts), [contacts]);
  const categoryStats = useMemo(() => aggregateCategories(contacts), [contacts]);

  // Summary stats
  const totalContacts = contacts.length;
  const uniqueCountries = new Set(contacts.map(c => c.location_country).filter(Boolean)).size;
  const uniqueCities = new Set(contacts.map(c => c.location_city).filter(Boolean)).size;
  const topCategory = categoryStats[0];

  // Drill-down handlers
  const handleTitleClick = (title: string) => {
    const filtered = contacts.filter(c => c.title === title);
    setDrillDownTitle(title);
    setDrillDownSubtitle(`${filtered.length} contact${filtered.length !== 1 ? 's' : ''}`);
    setDrillDownContacts(filtered);
    setDrillDownOpen(true);
  };

  const handleLocationClick = (city: string, country: string) => {
    const filtered = contacts.filter(c => 
      c.location_city === city && c.location_country === country
    );
    setDrillDownTitle(`${city}, ${country}`);
    setDrillDownSubtitle(`${filtered.length} contact${filtered.length !== 1 ? 's' : ''}`);
    setDrillDownContacts(filtered);
    setDrillDownOpen(true);
  };

  const handleWordClick = (word: string, type: string, matchingContacts: Contact[]) => {
    setDrillDownTitle(word);
    setDrillDownSubtitle(`${matchingContacts.length} contact${matchingContacts.length !== 1 ? 's' : ''} • ${type}`);
    setDrillDownContacts(matchingContacts);
    setDrillDownOpen(true);
  };

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!user) return null;

  return (
    <AppLayout>
      <div className="p-4 pb-24 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Understand your network at a glance
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                title="Total Contacts"
                value={totalContacts}
                icon={Users}
              />
              <StatCard
                title="Countries"
                value={uniqueCountries}
                icon={Globe}
              />
              <StatCard
                title="Cities"
                value={uniqueCities}
                icon={MapPin}
              />
              <StatCard
                title="Top Category"
                value={topCategory ? topCategory.label : "—"}
                subtitle={topCategory ? `${topCategory.count} contacts` : undefined}
                icon={TrendingUp}
              />
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5 bg-secondary/50">
                <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                <TabsTrigger value="insights" className="text-xs">Insights</TabsTrigger>
                <TabsTrigger value="roles" className="text-xs">Roles</TabsTrigger>
                <TabsTrigger value="location" className="text-xs">Location</TabsTrigger>
                <TabsTrigger value="category" className="text-xs">Category</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-4 space-y-4">
                <div className="glass-card p-4">
                  <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary" />
                    Category Distribution
                  </h3>
                  <CategoryChart data={categoryStats} />
                </div>

                {/* Quick Stats */}
                <div className="glass-card p-4">
                  <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Role Summary
                  </h3>
                  <div className="space-y-2">
                    {roleStats.slice(0, 5).map(role => (
                      <div key={role.group} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{role.group}</span>
                        <span className="text-sm font-medium">{role.total}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Locations */}
                <div className="glass-card p-4">
                  <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    Top Locations
                  </h3>
                  <div className="space-y-2">
                    {locationStats.slice(0, 5).map(loc => (
                      <div key={loc.country} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{loc.country}</span>
                        <span className="text-sm font-medium">{loc.total}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Insights Tab - Word Cloud */}
              <TabsContent value="insights" className="mt-4">
                <div className="glass-card p-4">
                  <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Network Word Cloud
                  </h3>
                  <WordCloud 
                    contacts={contacts}
                    onWordClick={handleWordClick}
                  />
                </div>
              </TabsContent>

              {/* Roles Tab */}
              <TabsContent value="roles" className="mt-4">
                <div className="glass-card p-4">
                  <RoleBreakdown 
                    data={roleStats}
                    contacts={contacts}
                    onContactClick={(contactId) => navigate(`/contacts/${contactId}`)}
                  />
                </div>
              </TabsContent>

              {/* Location Tab */}
              <TabsContent value="location" className="mt-4">
                <div className="glass-card p-4">
                  <LocationTree 
                    data={locationStats}
                    onLocationClick={handleLocationClick}
                  />
                </div>
              </TabsContent>

              {/* Category Tab */}
              <TabsContent value="category" className="mt-4 space-y-4">
                <div className="glass-card p-4">
                  <h3 className="text-sm font-medium mb-4">Category Breakdown</h3>
                  <div className="space-y-3">
                    {categoryStats.map(cat => {
                      const percentage = totalContacts > 0 
                        ? ((cat.count / totalContacts) * 100).toFixed(1) 
                        : 0;
                      return (
                        <div key={cat.category} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{cat.label}</span>
                            <span className="font-medium">{cat.count} ({percentage}%)</span>
                          </div>
                          <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      {/* Drill-down Modal */}
      <DrillDownModal
        open={drillDownOpen}
        onOpenChange={setDrillDownOpen}
        title={drillDownTitle}
        subtitle={drillDownSubtitle}
        contacts={drillDownContacts}
      />
    </AppLayout>
  );
}
