import { useState, useEffect } from "react";
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
import { Loader2, Save, Camera, User, Briefcase, Building2, Phone, Mail, MapPin, StickyNote } from "lucide-react";
import { toast } from "sonner";
const CATEGORY_OPTIONS = ["client", "prospect_client", "prospect_partner", "partner", "influencer", "random"] as const;
const MEETING_CONTEXT_OPTIONS = ["office_my", "office_client", "office_partner", "event", "other"] as const;

interface ExtractedData {
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  handwritten_notes: string;
}

interface LocationData {
  latitude: number | null;
  longitude: number | null;
  location_name: string;
}

export default function Review() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { imageUrl, imagePath, extractedData } = (location.state as {
    imageUrl?: string;
    imagePath?: string;
    extractedData?: ExtractedData;
  }) || {};

  const [formData, setFormData] = useState<ExtractedData>({
    name: "",
    title: "",
    company: "",
    phone: "",
    email: "",
    address: "",
    handwritten_notes: "",
  });
  const [category, setCategory] = useState<string>("random");
  const [meetingContext, setMeetingContext] = useState<string>("other");
  const [isSaving, setIsSaving] = useState(false);
  const [locationData, setLocationData] = useState<LocationData>({
    latitude: null,
    longitude: null,
    location_name: "",
  });
  const [isGettingLocation, setIsGettingLocation] = useState(false);

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
      setFormData(extractedData);
    }

    // Get location on mount
    getLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, imageUrl, extractedData]);

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

      // Reverse geocode to get location name (using a free API)
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const data = await response.json();
        if (data.address) {
          const city = data.address.city || data.address.town || data.address.village || "";
          const country = data.address.country || "";
          setLocationData((prev) => ({
            ...prev,
            location_name: [city, country].filter(Boolean).join(", "),
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
  };

  const handleSave = async () => {
    if (!user || !formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase.from("contacts").insert([{
        user_id: user.id,
        name: formData.name.trim(),
        title: formData.title.trim() || null,
        company: formData.company.trim() || "",
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || "",
        address: formData.address.trim() || null,
        notes: formData.handwritten_notes.trim() || null,
        category: category as "client" | "prospect_client" | "prospect_partner" | "partner" | "influencer" | "random",
        meeting_context: meetingContext as "office_my" | "office_client" | "office_partner" | "event" | "other",
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        location_name: locationData.location_name || null,
        card_image_url: imageUrl || null,
      }]).select().single();

      if (error) throw error;

      toast.success("Contact saved successfully!");
      navigate(`/contacts/${data.id}`);
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save contact. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetake = () => {
    navigate("/scan");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !imageUrl) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Review Contact</h1>
          <Button variant="outline" onClick={handleRetake} className="gap-2">
            <Camera className="h-4 w-4" />
            Retake
          </Button>
        </div>

        {/* Card image preview */}
        <div className="mb-6">
          <div className="relative w-full aspect-[1.75] rounded-xl overflow-hidden shadow-lg">
            <img
              src={imageUrl}
              alt="Business card"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Form */}
        <div className="glass-card p-6 space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Full name"
              className="bg-background/50"
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              Title
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Job title"
              className="bg-background/50"
            />
          </div>

          {/* Company */}
          <div className="space-y-2">
            <Label htmlFor="company" className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Company
            </Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => handleChange("company", e.target.value)}
              placeholder="Company name"
              className="bg-background/50"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Phone
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="Phone number"
              className="bg-background/50"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="Email address"
              className="bg-background/50"
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Address
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Address"
              className="bg-background/50"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Meeting Context */}
          <div className="space-y-2">
            <Label>Where did you meet?</Label>
            <Select value={meetingContext} onValueChange={setMeetingContext}>
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Select context" />
              </SelectTrigger>
              <SelectContent>
                {MEETING_CONTEXT_OPTIONS.map((ctx) => (
                  <SelectItem key={ctx} value={ctx}>
                    {ctx === "office_my"
                      ? "My Office"
                      : ctx === "office_client"
                      ? "Client's Office"
                      : ctx === "office_partner"
                      ? "Partner's Office"
                      : ctx.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          {locationData.location_name && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{locationData.location_name}</span>
              {isGettingLocation && <Loader2 className="h-3 w-3 animate-spin" />}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-muted-foreground" />
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.handwritten_notes}
              onChange={(e) => handleChange("handwritten_notes", e.target.value)}
              placeholder="Any additional notes..."
              rows={3}
              className="bg-background/50 resize-none"
            />
          </div>
        </div>

        {/* Save button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t border-border">
          <div className="max-w-2xl mx-auto">
            <Button
              onClick={handleSave}
              disabled={isSaving || !formData.name.trim()}
              className="w-full gap-2"
              size="lg"
            >
              {isSaving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              Save Contact
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
