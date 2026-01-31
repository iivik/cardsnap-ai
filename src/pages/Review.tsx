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
  Home,
} from "lucide-react";
import { toast } from "sonner";
import { LocationSelector } from "@/components/review/LocationSelector";

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
  inferred_country?: string;
  inferred_city?: string;
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

export default function Review() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { imageUrl, imagePath, extractedData, locationData: passedLocation } = (location.state as {
    imageUrl?: string;
    imagePath?: string;
    extractedData?: ExtractedData;
    locationData?: LocationData;
  }) || {};

  // Inferred location from AI
  const inferredCity = extractedData?.inferred_city || "";
  const inferredCountry = extractedData?.inferred_country || "";

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
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateContact, setDuplicateContact] = useState<DuplicateContact | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<"contacts" | "scan" | null>(null);
  const [existingLocations, setExistingLocations] = useState<Array<{city: string; country: string; count: number}>>([]);

  // Fetch existing locations from user's contacts
  useEffect(() => {
    const fetchExistingLocations = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from("contacts")
          .select("location_city, location_country")
          .eq("user_id", user.id)
          .not("location_country", "is", null);
        
        if (data) {
          const locationMap = new Map<string, number>();
          data.forEach(c => {
            const key = `${c.location_city || ''}|${c.location_country}`;
            locationMap.set(key, (locationMap.get(key) || 0) + 1);
          });
          
          const locations: Array<{city: string; country: string; count: number}> = [];
          locationMap.forEach((count, key) => {
            const [city, country] = key.split('|');
            if (country) {
              locations.push({ city, country, count });
            }
          });
          
          locations.sort((a, b) => b.count - a.count);
          setExistingLocations(locations);
        }
      } catch (err) {
        console.error("Error fetching locations:", err);
      }
    };
    
    fetchExistingLocations();
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (!authLoading && user && !imageUrl) {
      navigate("/scan");
      return;
    }

    if (extractedData) {
      // Handle both notes and legacy handwritten_notes
      const normalizedData = {
        ...extractedData,
        notes: extractedData.notes || extractedData.handwritten_notes || "",
      };
      setFormData(normalizedData);
    }

    // Use passed location, or inferred location, or get fresh location
    if (inferredCity || inferredCountry) {
      setLocationData({
        latitude: passedLocation?.latitude || null,
        longitude: passedLocation?.longitude || null,
        city: inferredCity,
        country: inferredCountry,
      });
    } else if (passedLocation && (passedLocation.city || passedLocation.country)) {
      setLocationData(passedLocation);
    } else {
      getLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, imageUrl, extractedData, passedLocation, inferredCity, inferredCountry]);

  const getLocation = async () => {
    if (!navigator.geolocation) return;

    setIsGettingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;
      setLocationData((prev) => ({
        ...prev,
        latitude,
        longitude,
      }));

      // Reverse geocode to get location name
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const data = await response.json();
        if (data.address) {
          setLocationData((prev) => ({
            ...prev,
            city: data.address.city || data.address.town || data.address.village || "",
            country: data.address.country || "",
          }));
        }
      } catch (geoError) {
        console.error("Reverse geocoding failed:", geoError);
      }
    } catch (err) {
      console.error("Location error:", err);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleChange = (field: keyof ExtractedData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
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

  const deleteCardImage = async () => {
    if (!imagePath) return;

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

  const saveContact = async (navigateTo: "contacts" | "scan") => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { data, error } = await supabase.from("contacts").insert([{
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
        card_image_url: imagePath || null,
      }]).select().single();

      if (error) throw error;

      // Delete temporary card image from storage
      await deleteCardImage();

      toast.success("Contact saved successfully!");
      
      if (navigateTo === "contacts") {
        navigate("/contacts");
      } else {
        navigate("/scan");
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save contact. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (navigateTo: "contacts" | "scan") => {
    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Check for duplicates
    const duplicate = await checkForDuplicates();
    if (duplicate) {
      setDuplicateContact(duplicate);
      setPendingNavigation(navigateTo);
      setShowDuplicateDialog(true);
      return;
    }

    await saveContact(navigateTo);
  };

  const handleMergeDuplicate = async () => {
    if (!user || !duplicateContact) return;

    setIsSaving(true);
    try {
      // Update existing contact with new data
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
          card_image_url: imagePath || null,
        })
        .eq("id", duplicateContact.id);

      if (error) throw error;

      // Delete temporary card image
      await deleteCardImage();

      toast.success("Contact updated successfully!");
      setShowDuplicateDialog(false);
      
      if (pendingNavigation === "contacts") {
        navigate("/contacts");
      } else {
        navigate("/scan");
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
    if (pendingNavigation) {
      await saveContact(pendingNavigation);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !imageUrl) return null;

  const locationDisplay = [locationData.city, locationData.country].filter(Boolean).join(", ");

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* Card Image Preview - Top 30% - Horizontal display */}
      <div className="h-[30vh] relative flex-shrink-0 bg-black/50 flex items-center justify-center overflow-hidden">
        <img
          src={imageUrl}
          alt="Business card"
          className="max-h-full object-contain"
          style={{ maxWidth: '95%', aspectRatio: '1.75 / 1', objectFit: 'contain' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80 pointer-events-none" />
        
        {/* Top buttons */}
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-2 bg-black/50 backdrop-blur-sm border-white/20 text-white hover:bg-black/70"
          >
            <Home className="h-4 w-4" />
            Home
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/scan")}
            className="gap-2 bg-black/50 backdrop-blur-sm border-white/20 text-white hover:bg-black/70"
          >
            <Camera className="h-4 w-4" />
            Retake
          </Button>
        </div>
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
            />
          </div>


          {/* Location (Display Only) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Location
            </Label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary/30 text-sm text-muted-foreground">
              {isGettingLocation ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Getting location...</span>
                </>
              ) : locationDisplay ? (
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
            />
          </div>
        </div>
      </ScrollArea>

      {/* Bottom Buttons - Fixed */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-lg border-t border-border">
        <div className="flex gap-3">
          <Button
            onClick={() => handleSave("scan")}
            disabled={isSaving}
            variant="outline"
            className="flex-1 gap-2 bg-primary/10 border-primary/30 hover:bg-primary/20"
            size="lg"
          >
            {isSaving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Camera className="h-5 w-5" />
            )}
            Continue Scanning
          </Button>
          <Button
            onClick={() => handleSave("contacts")}
            disabled={isSaving}
            className="flex-1 gap-2"
            size="lg"
            style={{ backgroundColor: "hsl(var(--success))", color: "hsl(var(--success-foreground))" }}
          >
            {isSaving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
            Process & Done
          </Button>
        </div>
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
