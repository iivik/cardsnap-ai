import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Search, ChevronDown, ChevronRight, Users, ArrowUpDown } from "lucide-react";
import { RoleStats } from "@/lib/analytics-utils";
import { cn } from "@/lib/utils";

interface RoleBreakdownProps {
  data: RoleStats[];
  onTitleClick?: (title: string) => void;
}

type SortMode = "count" | "alpha";

export function RoleBreakdown({ data, onTitleClick }: RoleBreakdownProps) {
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("count");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

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
          const isExpanded = expandedGroups.has(group.group);
          const percentage = totalContacts > 0 
            ? ((group.total / totalContacts) * 100).toFixed(1) 
            : 0;

          return (
            <Collapsible
              key={group.group}
              open={isExpanded}
              onOpenChange={() => toggleGroup(group.group)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
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
                <div className="pl-10 pr-3 py-2 space-y-1">
                  {group.titles.map(title => (
                    <div
                      key={title.title}
                      className={cn(
                        "flex items-center justify-between py-2 px-3 rounded-md text-sm",
                        onTitleClick && "cursor-pointer hover:bg-secondary/50 transition-colors"
                      )}
                      onClick={() => onTitleClick?.(title.title)}
                    >
                      <span className="text-muted-foreground truncate flex-1">
                        {title.title}
                      </span>
                      <span className="text-foreground font-medium ml-2">
                        {title.count}
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
            No roles found matching "{search}"
          </div>
        )}
      </div>
    </div>
  );
}
