import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Search, ChevronDown, ChevronRight, Globe, MapPin } from "lucide-react";
import { LocationStats } from "@/lib/analytics-utils";
import { cn } from "@/lib/utils";

interface LocationTreeProps {
  data: LocationStats[];
  onLocationClick?: (city: string, country: string) => void;
}

export function LocationTree({ data, onLocationClick }: LocationTreeProps) {
  const [search, setSearch] = useState("");
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());

  const toggleCountry = (country: string) => {
    setExpandedCountries(prev => {
      const next = new Set(prev);
      if (next.has(country)) {
        next.delete(country);
      } else {
        next.add(country);
      }
      return next;
    });
  };

  // Filter data based on search
  const filteredData = data
    .map(location => ({
      ...location,
      cities: location.cities.filter(c => 
        c.city.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter(location => 
      search === "" || 
      location.country.toLowerCase().includes(search.toLowerCase()) ||
      location.cities.length > 0
    );

  const totalContacts = data.reduce((sum, l) => sum + l.total, 0);

  // Expand countries that match search
  if (search && expandedCountries.size === 0) {
    filteredData.forEach(loc => {
      if (loc.cities.length > 0) {
        expandedCountries.add(loc.country);
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search countries or cities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-secondary/50"
        />
      </div>

      {/* Location Tree */}
      <div className="space-y-2">
        {filteredData.map(location => {
          const isExpanded = expandedCountries.has(location.country);
          const percentage = totalContacts > 0 
            ? ((location.total / totalContacts) * 100).toFixed(1) 
            : 0;

          return (
            <Collapsible
              key={location.country}
              open={isExpanded}
              onOpenChange={() => toggleCountry(location.country)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Globe className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">{location.country}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{location.total}</span>
                    <span className="text-xs text-muted-foreground">({percentage}%)</span>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="pl-10 pr-3 py-2 space-y-1">
                  {location.cities.map(city => (
                    <div
                      key={city.city}
                      className={cn(
                        "flex items-center justify-between py-2 px-3 rounded-md text-sm",
                        onLocationClick && "cursor-pointer hover:bg-secondary/50 transition-colors"
                      )}
                      onClick={() => onLocationClick?.(city.city, location.country)}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{city.city}</span>
                      </div>
                      <span className="text-foreground font-medium">
                        {city.count}
                      </span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}

        {filteredData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {search ? `No locations found matching "${search}"` : "No location data available"}
          </div>
        )}
      </div>
    </div>
  );
}
