import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Search, ChevronRight, Users, ArrowUpDown, User } from "lucide-react";
import { RoleStats } from "@/lib/analytics-utils";
import { cn } from "@/lib/utils";

interface Contact {
  id: string;
  name: string;
  company: string;
  title: string | null;
}

interface RoleBreakdownProps {
  data: RoleStats[];
  contacts?: Contact[];
  onContactClick?: (contactId: string) => void;
}

type SortMode = "count" | "alpha";

export function RoleBreakdown({ data, contacts = [], onContactClick }: RoleBreakdownProps) {
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("count");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedTitle, setExpandedTitle] = useState<string | null>(null);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  const toggleTitle = (title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Single expansion: close current if same, otherwise switch to new
    setExpandedTitle(prev => prev === title ? null : title);
  };

  // Get contacts for a specific title
  const getContactsForTitle = (title: string) => {
    return contacts.filter(c => 
      (c.title?.trim() || "No Title") === title
    );
  };

  // Filter and sort data
  const filteredData = data
    .map(group => ({
      ...group,
      titles: group.titles.filter(t => 
        t.title.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter(group => 
      search === "" || group.titles.length > 0 || group.group.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortMode === "alpha") {
        return a.group.localeCompare(b.group);
      }
      return b.total - a.total;
    });

  const totalContacts = data.reduce((sum, g) => sum + g.total, 0);

  return (
    <div className="space-y-4">
      {/* Search and Sort */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search roles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary/50"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSortMode(prev => prev === "count" ? "alpha" : "count")}
          title={sortMode === "count" ? "Sort alphabetically" : "Sort by count"}
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Role Groups */}
      <div className="space-y-2">
        {filteredData.map(group => {
          const isGroupExpanded = expandedGroups.has(group.group);
          const percentage = totalContacts > 0 
            ? ((group.total / totalContacts) * 100).toFixed(1) 
            : 0;

          return (
            <Collapsible
              key={group.group}
              open={isGroupExpanded}
              onOpenChange={() => toggleGroup(group.group)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <ChevronRight className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform duration-200",
                      isGroupExpanded && "rotate-90"
                    )} />
                    <Users className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">{group.group}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{group.total}</span>
                    <span className="text-xs text-muted-foreground">({percentage}%)</span>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="pl-6 pr-3 py-2 space-y-1">
                  {group.titles.map(title => {
                    const isTitleExpanded = expandedTitle === title.title;
                    const titleContacts = getContactsForTitle(title.title);

                    return (
                      <div key={title.title}>
                        {/* Title row - clickable to expand */}
                        <div
                          className={cn(
                            "flex items-center justify-between py-2 px-3 rounded-md text-sm cursor-pointer hover:bg-secondary/50 transition-colors",
                            isTitleExpanded && "bg-secondary/30"
                          )}
                          onClick={(e) => toggleTitle(title.title, e)}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            {title.count > 0 ? (
                              <ChevronRight className={cn(
                                "h-3 w-3 text-muted-foreground transition-transform duration-200",
                                isTitleExpanded && "rotate-90"
                              )} />
                            ) : (
                              <div className="w-3" />
                            )}
                            <span className="text-muted-foreground truncate">
                              {title.title}
                            </span>
                          </div>
                          <span className="text-foreground font-medium ml-2">
                            {title.count}
                          </span>
                        </div>

                        {/* Expanded contacts list */}
                        {isTitleExpanded && titleContacts.length > 0 && (
                          <div className="ml-8 mt-1 space-y-1">
                            {titleContacts.map(contact => (
                              <div
                                key={contact.id}
                                className={cn(
                                  "flex items-center gap-3 py-2 px-3 rounded-lg bg-secondary/20 border border-border/50",
                                  onContactClick && "cursor-pointer hover:bg-secondary/40 transition-colors"
                                )}
                                onClick={() => onContactClick?.(contact.id)}
                              >
                                <div className="p-1.5 rounded-full bg-primary/20">
                                  <User className="h-3 w-3 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {contact.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {contact.company}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}

        {filteredData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No roles found matching "{search}"
          </div>
        )}
      </div>
    </div>
  );
}