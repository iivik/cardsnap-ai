import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { User, Building2, MapPin, ExternalLink } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  title: string | null;
  company: string;
  email: string;
  location_city: string | null;
  location_country: string | null;
}

interface DrillDownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  contacts: Contact[];
}

export function DrillDownModal({
  open,
  onOpenChange,
  title,
  subtitle,
  contacts,
}: DrillDownModalProps) {
  const navigate = useNavigate();

  const handleContactClick = (contactId: string) => {
    onOpenChange(false);
    navigate(`/contacts/${contactId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </DialogHeader>
        
        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-2">
            {contacts.map(contact => (
              <div
                key={contact.id}
                className="p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                onClick={() => handleContactClick(contact.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{contact.name}</p>
                    {contact.title && (
                      <p className="text-xs text-muted-foreground truncate">
                        {contact.title}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      <span className="truncate">{contact.company}</span>
                    </div>
                    {(contact.location_city || contact.location_country) && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>
                          {[contact.location_city, contact.location_country]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {contacts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No contacts found
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
