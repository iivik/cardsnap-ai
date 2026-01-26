import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CategoryBadge, type CategoryType } from "@/components/ui/CategoryBadge";
import { GlassCard } from "@/components/ui/GlassCard";
import { EditContactModal } from "@/components/contacts/EditContactModal";
import { useToast } from "@/hooks/use-toast";
import { exportToPhoneContacts } from "@/lib/export-utils";
import { toast as sonnerToast } from "sonner";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  Trash2,
  Loader2,
  FileText,
  Globe,
  Share2,
} from "lucide-react";

interface Contact {
  id: string;
  name: string;
  title: string | null;
  company: string;
  email: string;
  phone: string | null;
  address: string | null;
  handwritten_notes: string | null;
  location_city: string | null;
  location_country: string | null;
  category: CategoryType;
  meeting_context: string | null;
  meeting_context_other: string | null;
  created_at: string;
}

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && id) {
      fetchContact();
    }
  }, [user, id]);

  const fetchContact = async () => {
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      
      setContact({
        ...data,
        category: (data.category as CategoryType) || 'random',
        meeting_context: data.meeting_context || null,
        meeting_context_other: data.meeting_context_other || null,
      });
    } catch (error) {
      console.error("Error fetching contact:", error);
      navigate("/contacts");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!contact) return;

    setDeleting(true);
    try {
      const { error } = await supabase.from("contacts").delete().eq("id", contact.id);

      if (error) throw error;

      toast({
        title: "Contact deleted",
        description: `${contact.name} has been removed from your CRM.`,
      });
      navigate("/contacts");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete contact. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !contact) return null;

  const initials = contact.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <header className="p-6 flex items-center justify-between animate-fade-in">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl glass-button"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex gap-2">
          <button 
            onClick={async () => {
              try {
                const success = await exportToPhoneContacts(contact);
                if (success) {
                  sonnerToast.success("Contact ready to save to your phone");
                } else {
                  sonnerToast.error("Export cancelled");
                }
              } catch (error) {
                console.error('Export failed:', error);
                sonnerToast.error("Unable to export contact. Please try again.");
              }
            }}
            className="p-2.5 rounded-xl glass-button"
            title="Save to phone contacts"
          >
            <Share2 className="h-5 w-5" />
          </button>
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="p-2.5 rounded-xl glass-button"
          >
            <Edit2 className="h-5 w-5" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2.5 rounded-xl glass-button text-destructive"
          >
            {deleting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Trash2 className="h-5 w-5" />
            )}
          </button>
        </div>
      </header>

      <div className="px-6 space-y-6">
        {/* Profile Card */}
        <GlassCard className="text-center animate-slide-up" style={{ animationDelay: "100ms" }}>
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-2xl font-semibold shadow-glow mb-4">
              {initials}
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-1">{contact.name}</h1>
            {contact.title && (
              <p className="text-muted-foreground mb-3">{contact.title}</p>
            )}
            <CategoryBadge category={contact.category} />
          </div>
        </GlassCard>

        {/* Contact Info */}
        <GlassCard className="animate-slide-up" style={{ animationDelay: "200ms" }}>
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Contact Information</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/10">
                <Building2 className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Company</p>
                <p className="font-medium text-foreground">{contact.company}</p>
              </div>
            </div>

            <a 
              href={`mailto:${contact.email}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 -mx-2 px-2 py-1 rounded-lg active:bg-white/10 transition-colors touch-manipulation"
            >
              <div className="p-2 rounded-xl bg-primary/20">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-foreground break-all">{contact.email}</p>
              </div>
            </a>

            {contact.phone && (
              <a 
                href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 -mx-2 px-2 py-1 rounded-lg active:bg-white/10 transition-colors touch-manipulation"
              >
                <div className="p-2 rounded-xl bg-primary/20">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium text-foreground">{contact.phone}</p>
                </div>
              </a>
            )}

            {contact.address && (
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 -mx-2 px-2 py-1 rounded-lg active:bg-white/10 transition-colors touch-manipulation"
              >
                <div className="p-2 rounded-xl bg-primary/20">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium text-foreground">{contact.address}</p>
                </div>
              </a>
            )}
          </div>
        </GlassCard>

        {/* Location */}
        {(contact.location_city || contact.location_country) && (
          <GlassCard className="animate-slide-up" style={{ animationDelay: "300ms" }}>
            <h2 className="text-sm font-medium text-muted-foreground mb-4">Met Location</h2>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/10">
                <Globe className="h-5 w-5 text-foreground" />
              </div>
              <p className="font-medium text-foreground">
                {[contact.location_city, contact.location_country].filter(Boolean).join(", ")}
              </p>
            </div>
          </GlassCard>
        )}

        {/* Notes */}
        {contact.handwritten_notes && (
          <GlassCard className="animate-slide-up" style={{ animationDelay: "400ms" }}>
            <h2 className="text-sm font-medium text-muted-foreground mb-4">Notes</h2>
            <div className="flex gap-3">
              <div className="p-2 rounded-xl bg-white/10 h-fit">
                <FileText className="h-5 w-5 text-foreground" />
              </div>
              <p className="text-foreground leading-relaxed">{contact.handwritten_notes}</p>
            </div>
          </GlassCard>
        )}

        {/* Meta */}
        <GlassCard className="animate-slide-up" style={{ animationDelay: "500ms" }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10">
              <Calendar className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Added</p>
              <p className="font-medium text-foreground">{formatDate(contact.created_at)}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Edit Contact Modal */}
      <EditContactModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        contact={contact}
        onSave={(updatedContact) => {
          setContact(updatedContact);
          setIsEditModalOpen(false);
        }}
      />
    </div>
  );
}
