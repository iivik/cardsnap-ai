import { Building2, Mail, Phone } from "lucide-react";
import { CategoryBadge, type CategoryType } from "@/components/ui/CategoryBadge";
import { GlassCard } from "@/components/ui/GlassCard";

interface Contact {
  id: string;
  name: string;
  title?: string;
  company: string;
  email: string;
  phone?: string;
  category: CategoryType;
  created_at: string;
}

interface ContactCardProps {
  contact: Contact;
  onClick?: () => void;
}

export function ContactCard({ contact, onClick }: ContactCardProps) {
  const initials = contact.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <GlassCard
      className="cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-semibold shadow-glow">
          {initials}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-foreground truncate">{contact.name}</h3>
              {contact.title && (
                <p className="text-sm text-muted-foreground truncate">{contact.title}</p>
              )}
            </div>
            <CategoryBadge category={contact.category} />
          </div>

          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{contact.company}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{contact.email}</span>
            </div>
            {contact.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>{contact.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
