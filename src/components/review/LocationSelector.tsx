import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Check, Sparkles, Plus, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExistingLocation {
  city: string;
  country: string;
  count: number;
}

interface LocationSelectorProps {
  inferredCity?: string;
  inferredCountry?: string;
  gpsCity?: string;
  gpsCountry?: string;
  existingLocations: ExistingLocation[];
  selectedCity: string;
  selectedCountry: string;
  onLocationChange: (city: string, country: string) => void;
  disabled?: boolean;
}

type LocationMode = "inferred" | "existing" | "custom" | "gps";

export function LocationSelector({
  inferredCity,
  inferredCountry,
  gpsCity,
  gpsCountry,
  existingLocations,
  selectedCity,
  selectedCountry,
  onLocationChange,
  disabled = false,
}: LocationSelectorProps) {
  const [mode, setMode] = useState<LocationMode>("inferred");
  const [customCity, setCustomCity] = useState("");
  const [customCountry, setCustomCountry] = useState("");
  const [selectedExisting, setSelectedExisting] = useState<string>("");

  const hasInferredLocation = inferredCity || inferredCountry;
  const hasGpsLocation = gpsCity || gpsCountry;
  const hasExistingLocations = existingLocations.length > 0;

  // Initialize mode based on available data
  useEffect(() => {
    if (hasInferredLocation) {
      setMode("inferred");
      onLocationChange(inferredCity || "", inferredCountry || "");
    } else if (hasGpsLocation) {
      setMode("gps");
      onLocationChange(gpsCity || "", gpsCountry || "");
    } else if (hasExistingLocations) {
      setMode("existing");
    } else {
      setMode("custom");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleModeChange = (newMode: LocationMode) => {
    setMode(newMode);
    
    if (newMode === "inferred") {
      onLocationChange(inferredCity || "", inferredCountry || "");
    } else if (newMode === "gps") {
      onLocationChange(gpsCity || "", gpsCountry || "");
    } else if (newMode === "existing" && selectedExisting) {
      const [city, country] = selectedExisting.split("|");
      onLocationChange(city, country);
    } else if (newMode === "custom") {
      onLocationChange(customCity, customCountry);
    }
  };

  const handleExistingChange = (value: string) => {
    setSelectedExisting(value);
    const [city, country] = value.split("|");
    onLocationChange(city, country);
  };

  const handleCustomChange = () => {
    onLocationChange(customCity, customCountry);
  };

  const confirmInferred = () => {
    onLocationChange(inferredCity || "", inferredCountry || "");
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2 text-sm">
        <Globe className="h-4 w-4 text-muted-foreground" />
        Contact Location
      </Label>

      {/* AI Suggested Location */}
      {hasInferredLocation && (
        <div 
          className={cn(
            "p-3 rounded-lg border transition-all cursor-pointer",
            mode === "inferred" 
              ? "border-primary bg-primary/10" 
              : "border-border bg-secondary/30 hover:border-primary/50"
          )}
          onClick={() => !disabled && handleModeChange("inferred")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">AI Detected</span>
            </div>
            {mode === "inferred" ? (
              <div className="flex items-center gap-1 text-xs text-primary">
                <Check className="h-3 w-3" />
                Selected
              </div>
            ) : (
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleModeChange("inferred");
                }}
                disabled={disabled}
              >
                Use This
              </Button>
            )}
          </div>
          <p className="text-sm text-foreground mt-1">
            {[inferredCity, inferredCountry].filter(Boolean).join(", ")}
          </p>
        </div>
      )}

      {/* GPS Location */}
      {hasGpsLocation && (
        <div 
          className={cn(
            "p-3 rounded-lg border transition-all cursor-pointer",
            mode === "gps" 
              ? "border-primary bg-primary/10" 
              : "border-border bg-secondary/30 hover:border-primary/50"
          )}
          onClick={() => !disabled && handleModeChange("gps")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Current Location</span>
            </div>
            {mode === "gps" ? (
              <div className="flex items-center gap-1 text-xs text-primary">
                <Check className="h-3 w-3" />
                Selected
              </div>
            ) : (
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleModeChange("gps");
                }}
                disabled={disabled}
              >
                Use This
              </Button>
            )}
          </div>
          <p className="text-sm text-foreground mt-1">
            {[gpsCity, gpsCountry].filter(Boolean).join(", ")}
          </p>
        </div>
      )}

      {/* Existing Locations Dropdown */}
      {hasExistingLocations && (
        <div className="space-y-2">
          <div 
            className={cn(
              "p-3 rounded-lg border transition-all",
              mode === "existing" 
                ? "border-primary bg-primary/10" 
                : "border-border bg-secondary/30"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Your Locations</span>
            </div>
            <Select 
              value={selectedExisting} 
              onValueChange={(v) => {
                handleModeChange("existing");
                handleExistingChange(v);
              }}
              disabled={disabled}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select from your contacts..." />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {existingLocations.map((loc) => {
                  const key = `${loc.city}|${loc.country}`;
                  const label = [loc.city, loc.country].filter(Boolean).join(", ");
                  return (
                    <SelectItem key={key} value={key}>
                      {label} ({loc.count})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Custom Location Entry */}
      <div 
        className={cn(
          "p-3 rounded-lg border transition-all",
          mode === "custom" 
            ? "border-primary bg-primary/10" 
            : "border-border bg-secondary/30"
        )}
      >
        <div 
          className="flex items-center gap-2 mb-2 cursor-pointer"
          onClick={() => !disabled && handleModeChange("custom")}
        >
          <Plus className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Add New Location</span>
        </div>
        {mode === "custom" && (
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="City"
              value={customCity}
              onChange={(e) => {
                setCustomCity(e.target.value);
              }}
              onBlur={handleCustomChange}
              className="bg-background"
              disabled={disabled}
            />
            <Input
              placeholder="Country"
              value={customCountry}
              onChange={(e) => {
                setCustomCountry(e.target.value);
              }}
              onBlur={handleCustomChange}
              className="bg-background"
              disabled={disabled}
            />
          </div>
        )}
      </div>

      {/* Current Selection Display */}
      {(selectedCity || selectedCountry) && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary/5 border border-primary/20">
          <Check className="h-4 w-4 text-primary" />
          <span className="text-sm">
            <span className="text-muted-foreground">Selected:</span>{" "}
            <span className="font-medium">{[selectedCity, selectedCountry].filter(Boolean).join(", ")}</span>
          </span>
        </div>
      )}
    </div>
  );
}
