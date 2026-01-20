import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  User,
  Briefcase,
  Building2,
  Phone,
  Mail,
  MapPin,
  StickyNote,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { CategoryType } from "@/components/ui/CategoryBadge";

const CATEGORY_OPTIONS = [
  { value: "client", label: "Client" },
  { value: "prospect_client", label: "Prospect - Client" },
  { value: "prospect_partner", label: "Prospect - Partner" },
  { value: "partner", label: "Partner" },
  { value: "influencer", label: "Influencer" },
  { value: "random", label: "Random/Other" },
] as const;

const MEETING_CONTEXT_OPTIONS = [
  { value: "office_my", label: "Office Meeting - My Office" },
  { value: "office_client", label: "Office Meeting - Client Office" },
  { value: "office_partner", label: "Office Meeting - Partner Office" },
  { value: "event", label: "Event/Conference" },
  { value: "other", label: "Other" },
] as const;

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

interface EditContactModalProps {
  open: boolean;
  onClose: () => void;
  contact: Contact;
  onSave: (updatedContact: Contact) => void;
}

export function EditContactModal({ open, onClose, contact, onSave }: EditContactModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    company: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });
  const [category, setCategory] = useState<string>("random");
  const [meetingContext, setMeetingContext] = useState<string>("");
  const [meetingContextOther, setMeetingContextOther] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && contact) {
      setFormData({
        name: contact.name || "",
        title: contact.title || "",
        company: contact.company || "",
        phone: contact.phone || "",
        email: contact.email || "",
        address: contact.address || "",
        notes: contact.handwritten_notes || "",
      });
      setCategory(contact.category || "random");
      setMeetingContext(contact.meeting_context || "");
      setMeetingContextOther(contact.meeting_context_other || "");
      setErrors({});
    }
  }, [open, contact]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.company.trim()) {
      newErrors.company = "Company is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email";
    }
    if (!meetingContext) {
      newErrors.meetingContext = "Meeting context is required";
    }
    if (meetingContext === "other" && !meetingContextOther.trim()) {
      newErrors.meetingContextOther = "Please specify the meeting context";
    }
    if (!category) {
      newErrors.category = "Category is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from("contacts")
        .update({
          name: formData.name.trim(),
          title: formData.title.trim() || null,
          company: formData.company.trim(),
          phone: formData.phone.trim() || null,
          email: formData.email.trim(),
          address: formData.address.trim() || null,
          handwritten_notes: formData.notes.trim() || null,
          category: category as CategoryType,
          meeting_context: meetingContext as "office_my" | "office_client" | "office_partner" | "event" | "other",
          meeting_context_other: meetingContext === "other" ? meetingContextOther.trim() : null,
        })
        .eq("id", contact.id)
        .select()
        .single();

      if (error) throw error;

      toast.success("Contact updated successfully!");
      onSave({
        ...contact,
        ...data,
        category: (data.category as CategoryType) || "random",
      });
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Failed to update contact. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const locationDisplay = [contact.location_city, contact.location_country].filter(Boolean).join(", ");

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>Edit Contact</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Full name"
                className={`bg-secondary/50 ${errors.name ? "border-destructive" : ""}`}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="flex items-center gap-2 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                Title
              </Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Job title"
                className="bg-secondary/50"
              />
            </div>

            {/* Company */}
            <div className="space-y-2">
              <Label htmlFor="edit-company" className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Company <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-company"
                value={formData.company}
                onChange={(e) => handleChange("company", e.target.value)}
                placeholder="Company name"
                className={`bg-secondary/50 ${errors.company ? "border-destructive" : ""}`}
              />
              {errors.company && <p className="text-xs text-destructive">{errors.company}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="edit-phone" className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Phone
              </Label>
              <Input
                id="edit-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="Phone number"
                className="bg-secondary/50"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="edit-email" className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Email address"
                className={`bg-secondary/50 ${errors.email ? "border-destructive" : ""}`}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="edit-address" className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Address
              </Label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Address"
                rows={2}
                className="bg-secondary/50 resize-none"
              />
            </div>


            {/* Location (Display Only) */}
            {locationDisplay && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Location
                </Label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary/30 text-sm text-muted-foreground">
                  <span>{locationDisplay}</span>
                </div>
              </div>
            )}

            {/* Meeting Context */}
            <div className="space-y-2">
              <Label className="text-sm">
                Meeting Context <span className="text-destructive">*</span>
              </Label>
              <Select value={meetingContext} onValueChange={(v) => {
                setMeetingContext(v);
                if (errors.meetingContext) setErrors((prev) => ({ ...prev, meetingContext: "" }));
              }}>
                <SelectTrigger className={`bg-secondary/50 ${errors.meetingContext ? "border-destructive" : ""}`}>
                  <SelectValue placeholder="Where did you meet?" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {MEETING_CONTEXT_OPTIONS.map((ctx) => (
                    <SelectItem key={ctx.value} value={ctx.value}>
                      {ctx.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.meetingContext && <p className="text-xs text-destructive">{errors.meetingContext}</p>}
            </div>

            {/* Meeting Context Other */}
            {meetingContext === "other" && (
              <div className="space-y-2">
                <Label htmlFor="edit-meetingContextOther" className="text-sm">
                  Please specify <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-meetingContextOther"
                  value={meetingContextOther}
                  onChange={(e) => {
                    setMeetingContextOther(e.target.value);
                    if (errors.meetingContextOther) setErrors((prev) => ({ ...prev, meetingContextOther: "" }));
                  }}
                  placeholder="Describe where you met..."
                  className={`bg-secondary/50 ${errors.meetingContextOther ? "border-destructive" : ""}`}
                />
                {errors.meetingContextOther && <p className="text-xs text-destructive">{errors.meetingContextOther}</p>}
              </div>
            )}

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-sm">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select value={category} onValueChange={(v) => {
                setCategory(v);
                if (errors.category) setErrors((prev) => ({ ...prev, category: "" }));
              }}>
                <SelectTrigger className={`bg-secondary/50 ${errors.category ? "border-destructive" : ""}`}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
            </div>

            {/* Notes - Last field */}
            <div className="space-y-2">
              <Label htmlFor="edit-notes" className="flex items-center gap-2 text-sm">
                <StickyNote className="h-4 w-4 text-muted-foreground" />
                Notes
              </Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Notes from the card or your own observations..."
                rows={3}
                className="bg-secondary/50 resize-none"
              />
            </div>
          </div>
        </ScrollArea>

        {/* Bottom Buttons */}
        <div className="p-4 border-t border-border flex-shrink-0">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
