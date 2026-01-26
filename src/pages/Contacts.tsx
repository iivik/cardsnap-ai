import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { ContactCard } from "@/components/contacts/ContactCard";
import { EmptyState } from "@/components/contacts/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { exportMultipleToPhone } from "@/lib/export-utils";
import { toast } from "sonner";
import { Search, Filter, Loader2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CategoryType } from "@/components/ui/CategoryBadge";

interface Contact {
  id: string;
  name: string;
  title: string | null;
  company: string;
  email: string;
  phone: string | null;
  category: CategoryType;
  created_at: string;
}

const categories: { value: CategoryType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "client", label: "Clients" },
  { value: "prospect_client", label: "Prospects" },
  { value: "partner", label: "Partners" },
  { value: "influencer", label: "Influencers" },
  { value: "random", label: "Other" },
];

export default function Contacts() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryType | "all">("all");

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
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const mappedContacts: Contact[] = (data || []).map(contact => ({
        id: contact.id,
        name: contact.name,
        title: contact.title,
        company: contact.company,
        email: contact.email,
        phone: contact.phone,
        category: (contact.category as CategoryType) || 'random',
        created_at: contact.created_at,
      }));
      
      setContacts(mappedContacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      search === "" ||
      contact.name.toLowerCase().includes(search.toLowerCase()) ||
      contact.company.toLowerCase().includes(search.toLowerCase()) ||
      contact.email.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || contact.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const handleExportFiltered = async () => {
    if (filteredContacts.length === 0) return;
    
    // Map to export format
    const exportData = filteredContacts.map(c => ({
      name: c.name,
      title: c.title,
      company: c.company,
      email: c.email,
      phone: c.phone,
      category: c.category,
    }));

    try {
      const success = await exportMultipleToPhone(exportData);
      if (success) {
        toast.success(`${filteredContacts.length} contacts ready to save`);
      } else {
        toast.error("Export cancelled");
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error("Unable to export contacts. Please try again.");
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <header className="animate-fade-in flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Contacts</h1>
            <p className="text-muted-foreground">
              {contacts.length} contact{contacts.length !== 1 ? "s" : ""} in your CRM
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExportFiltered}
            disabled={filteredContacts.length === 0 || loading}
            title="Export filtered contacts"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </header>

        {/* Search & Filter */}
        <div className="space-y-4 animate-slide-up" style={{ animationDelay: "100ms" }}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="glass-input w-full pl-12"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6">
            {categories.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setCategoryFilter(value)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  categoryFilter === value
                    ? "bg-primary text-primary-foreground"
                    : "glass-button"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Contacts List */}
        <section className="animate-slide-up" style={{ animationDelay: "200ms" }}>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass-card p-6 shimmer h-32" />
              ))}
            </div>
          ) : filteredContacts.length === 0 ? (
            search || categoryFilter !== "all" ? (
              <div className="glass-card p-8 text-center">
                <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No matches found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            ) : (
              <EmptyState />
            )
          ) : (
            <div className="space-y-4 stagger-children">
              {filteredContacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={{
                    ...contact,
                    title: contact.title ?? undefined,
                    phone: contact.phone ?? undefined,
                  }}
                  onClick={() => navigate(`/contacts/${contact.id}`)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
