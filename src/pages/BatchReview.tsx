import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  CheckCircle2,
  Camera,
  User,
  Briefcase,
  Building2,
  Phone,
  Mail,
  MapPin,
  StickyNote,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Home,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

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

interface ExtractedData {
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  handwritten_notes?: string; // Legacy support
}

interface CapturedCard {
  imageUrl: string;
  imagePath: string;
  extractedData?: ExtractedData;
  isProcessing?: boolean;
  isProcessed?: boolean;
}

interface LocationData {
  latitude: number | null;
  longitude: number | null;
  city: string;
  country: string;
}

interface DuplicateContact {
  id: string;
  name: string;
  company: string;
  email: string;
}

export default function BatchReview() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { cards: initialCards, locationData: passedLocation } = (location.state as {
    cards?: CapturedCard[];
    locationData?: LocationData;
  }) || {};

  const [cards, setCards] = useState<CapturedCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [processingIndex, setProcessingIndex] = useState(-1);
  
  const [formData, setFormData] = useState<ExtractedData>({
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
  const [locationData, setLocationData] = useState<LocationData>({
    latitude: null,
    longitude: null,
    city: "",
    country: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateContact, setDuplicateContact] = useState<DuplicateContact | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  // Initialize cards and location
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (!authLoading && user && (!initialCards || initialCards.length === 0)) {
      navigate("/scan");
      return;
    }

    if (initialCards) {
      setCards(initialCards);
      if (passedLocation) {
        setLocationData(passedLocation);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, initialCards]);

  // Process all cards with AI extraction
  useEffect(() => {
    if (cards.length > 0 && !isProcessingAll && cards.some(c => !c.isProcessed)) {
      processAllCards();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.length]);

  const processAllCards = async () => {
    setIsProcessingAll(true);
    
    for (let i = 0; i < cards.length; i++) {
      if (cards[i].isProcessed) continue;
      
      setProcessingIndex(i);
      
      try {
        const { data, error } = await supabase.functions.invoke("extract-card", {
          body: { imageUrl: cards[i].imageUrl },
        });

        if (error) throw error;

        const extractedData: ExtractedData = {
          name: data?.data?.name || "",
          title: data?.data?.title || "",
          company: data?.data?.company || "",
          phone: data?.data?.phone || "",
          email: data?.data?.email || "",
          address: data?.data?.address || "",
          notes: data?.data?.notes || data?.data?.handwritten_notes || "",
        };

        setCards(prev => prev.map((card, idx) => 
          idx === i 
            ? { ...card, extractedData, isProcessed: true, isProcessing: false }
            : card
        ));
      } catch (err) {
        console.error(`Error processing card ${i}:`, err);
        setCards(prev => prev.map((card, idx) => 
          idx === i 
            ? { ...card, extractedData: { name: "", title: "", company: "", phone: "", email: "", address: "", notes: "" }, isProcessed: true, isProcessing: false }
            : card
        ));
      }
    }
    
    setProcessingIndex(-1);
    setIsProcessingAll(true);
  };

  // Load current card data into form
  useEffect(() => {
    const currentCard = cards[currentIndex];
    if (currentCard?.extractedData) {
      // Handle both notes and legacy handwritten_notes
      const normalizedData = {
        ...currentCard.extractedData,
        notes: currentCard.extractedData.notes || currentCard.extractedData.handwritten_notes || "",
      };
      setFormData(normalizedData);
    } else {
      setFormData({
        name: "",
        title: "",
        company: "",
        phone: "",
        email: "",
        address: "",
        notes: "",
      });
    }
    // Reset category and meeting context for each card
    setCategory("random");
    setMeetingContext("");
    setMeetingContextOther("");
    setErrors({});
  }, [currentIndex, cards]);

  const handleChange = (field: keyof ExtractedData, value: string) => {
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

  const checkForDuplicates = async (): Promise<DuplicateContact | null> => {
    if (!user) return null;

    try {
      const { data } = await supabase
        .from("contacts")
        .select("id, name, company, email")
        .eq("user_id", user.id)
        .ilike("name", formData.name.trim())
        .ilike("company", formData.company.trim())
        .limit(1)
        .maybeSingle();

      return data;
    } catch (err) {
      console.error("Error checking duplicates:", err);
      return null;
    }
  };

  const deleteCardImage = async (imagePath: string) => {
    try {
      const { error } = await supabase.storage
        .from("card-images")
        .remove([imagePath]);
      
      if (error) {
        console.error("Error deleting card image:", error);
      }
    } catch (err) {
      console.error("Error deleting card image:", err);
    }
  };

  const saveCurrentCard = async (): Promise<boolean> => {
    if (!user) return false;

    const currentCard = cards[currentIndex];
    if (!currentCard) return false;

    setIsSaving(true);
    try {
      const { error } = await supabase.from("contacts").insert([{
        user_id: user.id,
        name: formData.name.trim(),
        title: formData.title.trim() || null,
        company: formData.company.trim(),
        phone: formData.phone.trim() || null,
        email: formData.email.trim(),
        address: formData.address.trim() || null,
        handwritten_notes: formData.notes.trim() || null,
        category: category as "client" | "prospect_client" | "prospect_partner" | "partner" | "influencer" | "random",
        meeting_context: meetingContext as "office_my" | "office_client" | "office_partner" | "event" | "other",
        meeting_context_other: meetingContext === "other" ? meetingContextOther.trim() : null,
        gps_latitude: locationData.latitude,
        gps_longitude: locationData.longitude,
        location_city: locationData.city || null,
        location_country: locationData.country || null,
        card_image_url: currentCard.imagePath || null,
      }]);

      if (error) throw error;

      // Delete temporary card image from storage
      await deleteCardImage(currentCard.imagePath);

      setSavedCount(prev => prev + 1);
      return true;
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save contact. Please try again.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndNext = async () => {
    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Check for duplicates
    const duplicate = await checkForDuplicates();
    if (duplicate) {
      setDuplicateContact(duplicate);
      setShowDuplicateDialog(true);
      return;
    }

    const success = await saveCurrentCard();
    if (success) {
      toast.success(`Contact saved (${savedCount + 1}/${cards.length})`);
      
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // All cards saved
        navigate("/contacts");
      }
    }
  };

  const handleMergeDuplicate = async () => {
    if (!user || !duplicateContact) return;

    const currentCard = cards[currentIndex];
    if (!currentCard) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("contacts")
        .update({
          name: formData.name.trim(),
          title: formData.title.trim() || null,
          company: formData.company.trim(),
          phone: formData.phone.trim() || null,
          email: formData.email.trim(),
          address: formData.address.trim() || null,
          handwritten_notes: formData.notes.trim() || null,
          category: category as "client" | "prospect_client" | "prospect_partner" | "partner" | "influencer" | "random",
          meeting_context: meetingContext as "office_my" | "office_client" | "office_partner" | "event" | "other",
          meeting_context_other: meetingContext === "other" ? meetingContextOther.trim() : null,
          gps_latitude: locationData.latitude,
          gps_longitude: locationData.longitude,
          location_city: locationData.city || null,
          location_country: locationData.country || null,
          card_image_url: currentCard.imagePath || null,
        })
        .eq("id", duplicateContact.id);

      if (error) throw error;

      await deleteCardImage(currentCard.imagePath);
      
      setSavedCount(prev => prev + 1);
      toast.success("Contact updated successfully!");
      setShowDuplicateDialog(false);
      
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        navigate("/contacts");
      }
    } catch (err) {
      console.error("Merge error:", err);
      toast.error("Failed to update contact. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNew = async () => {
    setShowDuplicateDialog(false);
    const success = await saveCurrentCard();
    if (success) {
      toast.success(`Contact saved (${savedCount + 1}/${cards.length})`);
      
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        navigate("/contacts");
      }
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || cards.length === 0) return null;

  const currentCard = cards[currentIndex];
  const isCurrentCardProcessing = processingIndex === currentIndex;
  const locationDisplay = [locationData.city, locationData.country].filter(Boolean).join(", ");
  const isLastCard = currentIndex === cards.length - 1;
  const progressPercent = ((savedCount) / cards.length) * 100;

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* Progress Header */}
      <div className="flex-shrink-0 p-4 border-b border-border bg-background/90 backdrop-blur-lg">
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Home
          </Button>
          <span className="text-sm text-muted-foreground">
            Card {currentIndex + 1} of {cards.length}
          </span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNext}
              disabled={currentIndex === cards.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Progress value={progressPercent} className="h-2" />
        <p className="text-xs text-muted-foreground mt-1 text-center">
          {savedCount} of {cards.length} saved
        </p>
      </div>

      {/* Card Image Preview - Top 25% - Horizontal display */}
      <div className="h-[25vh] relative flex-shrink-0 bg-black/50 flex items-center justify-center overflow-hidden">
        {currentCard && (
          <img
            src={currentCard.imageUrl}
            alt="Business card"
            className="max-h-full object-contain"
            style={{ maxWidth: '95%', aspectRatio: '1.75 / 1', objectFit: 'contain' }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80 pointer-events-none" />
        
        {/* Processing overlay */}
        {isCurrentCardProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="text-center space-y-2">
              <Sparkles className="h-8 w-8 text-primary animate-pulse mx-auto" />
              <p className="text-white text-sm">Extracting...</p>
            </div>
          </div>
        )}
      </div>

      {/* Scrollable Form - Middle */}
      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="p-4 pb-32 space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Full name"
              className={`bg-secondary/50 ${errors.name ? "border-destructive" : ""}`}
              disabled={isCurrentCardProcessing}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2 text-sm">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              Title
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Job title"
              className="bg-secondary/50"
              disabled={isCurrentCardProcessing}
            />
          </div>

          {/* Company */}
          <div className="space-y-2">
            <Label htmlFor="company" className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Company <span className="text-destructive">*</span>
            </Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => handleChange("company", e.target.value)}
              placeholder="Company name"
              className={`bg-secondary/50 ${errors.company ? "border-destructive" : ""}`}
              disabled={isCurrentCardProcessing}
            />
            {errors.company && <p className="text-xs text-destructive">{errors.company}</p>}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Phone
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="Phone number"
              className="bg-secondary/50"
              disabled={isCurrentCardProcessing}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="Email address"
              className={`bg-secondary/50 ${errors.email ? "border-destructive" : ""}`}
              disabled={isCurrentCardProcessing}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Address
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Address"
              rows={2}
              className="bg-secondary/50 resize-none"
              disabled={isCurrentCardProcessing}
            />
          </div>


          {/* Location (Display Only) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Location
            </Label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary/30 text-sm text-muted-foreground">
              {locationDisplay ? (
                <span>{locationDisplay}</span>
              ) : (
                <span className="italic">Location not available</span>
              )}
            </div>
          </div>

          {/* Meeting Context */}
          <div className="space-y-2">
            <Label className="text-sm">
              Meeting Context <span className="text-destructive">*</span>
            </Label>
            <Select value={meetingContext} onValueChange={(v) => {
              setMeetingContext(v);
              if (errors.meetingContext) setErrors((prev) => ({ ...prev, meetingContext: "" }));
            }} disabled={isCurrentCardProcessing}>
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
              <Label htmlFor="meetingContextOther" className="text-sm">
                Please specify <span className="text-destructive">*</span>
              </Label>
              <Input
                id="meetingContextOther"
                value={meetingContextOther}
                onChange={(e) => {
                  setMeetingContextOther(e.target.value);
                  if (errors.meetingContextOther) setErrors((prev) => ({ ...prev, meetingContextOther: "" }));
                }}
                placeholder="Describe where you met..."
                className={`bg-secondary/50 ${errors.meetingContextOther ? "border-destructive" : ""}`}
                disabled={isCurrentCardProcessing}
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
            }} disabled={isCurrentCardProcessing}>
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
            <Label htmlFor="notes" className="flex items-center gap-2 text-sm">
              <StickyNote className="h-4 w-4 text-muted-foreground" />
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Notes from the card or your own observations..."
              rows={3}
              className="bg-secondary/50 resize-none"
              disabled={isCurrentCardProcessing}
            />
          </div>
        </div>
      </ScrollArea>

      {/* Bottom Buttons - Fixed */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-lg border-t border-border">
        <Button
          onClick={handleSaveAndNext}
          disabled={isSaving || isCurrentCardProcessing}
          className="w-full gap-2"
          size="lg"
          style={{ backgroundColor: "hsl(var(--success))", color: "hsl(var(--success-foreground))" }}
        >
          {isSaving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-5 w-5" />
          )}
          {isLastCard ? "Save & Finish" : "Save & Next"}
        </Button>
      </div>

      {/* Duplicate Detection Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" style={{ color: "hsl(var(--warning))" }} />
              Duplicate Contact Found
            </DialogTitle>
            <DialogDescription>
              A contact with the same name and company already exists:
              <div className="mt-3 p-3 rounded-lg bg-secondary/50 text-foreground">
                <p className="font-medium">{duplicateContact?.name}</p>
                <p className="text-sm text-muted-foreground">{duplicateContact?.company}</p>
                <p className="text-sm text-muted-foreground">{duplicateContact?.email}</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleCreateNew}
              disabled={isSaving}
              className="flex-1"
            >
              Create New
            </Button>
            <Button
              onClick={handleMergeDuplicate}
              disabled={isSaving}
              className="flex-1"
              style={{ backgroundColor: "hsl(var(--warning))", color: "hsl(var(--warning-foreground))" }}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Existing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
