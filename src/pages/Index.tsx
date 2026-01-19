import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { ContactCard } from "@/components/contacts/ContactCard";
import { EmptyState } from "@/components/contacts/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { Camera, LogOut, Sparkles, CreditCard, Loader2 } from "lucide-react";
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

export default function Index() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

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
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      
      // Map the data to ensure proper typing
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

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-purple-500 shadow-glow">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">CardSnap</h1>
              <p className="text-xs text-muted-foreground">AI-Powered CRM</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2.5 rounded-xl glass-button"
            title="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        {/* Hero Section */}
        <section className="glass-card p-8 text-center animate-slide-up" style={{ animationDelay: "100ms" }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            AI-Powered Scanning
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Capture Business Cards Instantly
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Point your camera at any business card and let AI extract all the details automatically
          </p>
          <Link to="/scan" className="gradient-button inline-flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan Cards
          </Link>
        </section>

        {/* Recent Contacts */}
        <section className="animate-slide-up" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Recent Contacts</h3>
            {contacts.length > 0 && (
              <Link
                to="/contacts"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                View all
              </Link>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card p-6 shimmer h-32" />
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4 stagger-children">
              {contacts.map((contact) => (
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
