import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Contact {
  id: string;
  name: string;
  company: string;
  location_city: string | null;
  location_country: string | null;
}

interface WordCloudProps {
  contacts: Contact[];
  onWordClick?: (word: string, type: string, matchingContacts: Contact[]) => void;
}

type FilterType = "companies" | "locations" | "names";

interface WordData {
  text: string;
  value: number;
  color: string;
}

const COLORS = [
  "hsl(340, 82%, 52%)",  // Pink
  "hsl(25, 95%, 53%)",   // Orange
  "hsl(173, 80%, 40%)",  // Teal
  "hsl(262, 83%, 58%)",  // Purple
  "hsl(142, 71%, 45%)",  // Green
  "hsl(217, 91%, 55%)",  // Blue
  "hsl(38, 95%, 50%)",   // Amber
];

export function WordCloud({ contacts, onWordClick }: WordCloudProps) {
  const [filter, setFilter] = useState<FilterType>("companies");

  const getCompanyWords = useMemo((): WordData[] => {
    const freq: Record<string, number> = {};
    contacts.forEach(c => {
      if (c.company) {
        const company = c.company.trim();
        freq[company] = (freq[company] || 0) + 1;
      }
    });
    return Object.entries(freq)
      .map(([text, value], idx) => ({
        text,
        value,
        color: COLORS[idx % COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 30);
  }, [contacts]);

  const getLocationWords = useMemo((): WordData[] => {
    const freq: Record<string, number> = {};
    contacts.forEach(c => {
      if (c.location_city) {
        freq[c.location_city] = (freq[c.location_city] || 0) + 1;
      }
      if (c.location_country) {
        freq[c.location_country] = (freq[c.location_country] || 0) + 1;
      }
    });
    return Object.entries(freq)
      .map(([text, value], idx) => ({
        text,
        value,
        color: COLORS[idx % COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 30);
  }, [contacts]);

  const getNameWords = useMemo((): WordData[] => {
    const freq: Record<string, number> = {};
    contacts.forEach(c => {
      if (c.name) {
        // Extract first names for more interesting patterns
        const firstName = c.name.split(" ")[0];
        if (firstName.length > 1) {
          freq[firstName] = (freq[firstName] || 0) + 1;
        }
      }
    });
    return Object.entries(freq)
      .filter(([, count]) => count > 1) // Only show names that appear more than once
      .map(([text, value], idx) => ({
        text,
        value,
        color: COLORS[idx % COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 30);
  }, [contacts]);

  const words = useMemo(() => {
    switch (filter) {
      case "companies":
        return getCompanyWords;
      case "locations":
        return getLocationWords;
      case "names":
        return getNameWords;
    }
  }, [filter, getCompanyWords, getLocationWords, getNameWords]);

  const maxValue = Math.max(...words.map(w => w.value), 1);
  const minSize = 14;
  const maxSize = 36;

  const getMatchingContacts = (word: string, type: FilterType): Contact[] => {
    switch (type) {
      case "companies":
        return contacts.filter(c => c.company === word);
      case "locations":
        return contacts.filter(c => c.location_city === word || c.location_country === word);
      case "names":
        return contacts.filter(c => c.name.split(" ")[0] === word);
    }
  };

  const handleWordClick = (word: WordData) => {
    if (onWordClick) {
      const matching = getMatchingContacts(word.text, filter);
      onWordClick(word.text, filter, matching);
    }
  };

  if (contacts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No contacts to analyze
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === "companies" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("companies")}
          className="text-xs"
        >
          Companies
        </Button>
        <Button
          variant={filter === "locations" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("locations")}
          className="text-xs"
        >
          Locations
        </Button>
        <Button
          variant={filter === "names" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("names")}
          className="text-xs"
        >
          Names
        </Button>
      </div>

      {/* Word Cloud */}
      <div className="min-h-[200px] p-4 flex flex-wrap gap-3 items-center justify-center">
        {words.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {filter === "names" 
              ? "No recurring first names found" 
              : `No ${filter} data available`}
          </p>
        ) : (
          words.map((word, idx) => {
            const size = minSize + ((word.value / maxValue) * (maxSize - minSize));
            return (
              <button
                key={`${word.text}-${idx}`}
                onClick={() => handleWordClick(word)}
                className={cn(
                  "transition-all duration-200 hover:scale-110 hover:opacity-80",
                  "cursor-pointer font-medium animate-fade-in"
                )}
                style={{
                  fontSize: `${size}px`,
                  color: word.color,
                  animationDelay: `${idx * 30}ms`,
                }}
              >
                {word.text}
                {word.value > 1 && (
                  <sup className="ml-0.5 text-xs opacity-60">{word.value}</sup>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Legend */}
      <p className="text-xs text-muted-foreground text-center">
        Click a word to see matching contacts
      </p>
    </div>
  );
}
