import * as React from "react";
import { cn } from "@/lib/utils";

type CategoryType = "client" | "prospect_client" | "prospect_partner" | "partner" | "influencer" | "random";

interface CategoryBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  category: CategoryType;
}

const categoryLabels: Record<CategoryType, string> = {
  client: "Client",
  prospect_client: "Prospect",
  prospect_partner: "Partner Lead",
  partner: "Partner",
  influencer: "Influencer",
  random: "Contact",
};

const categoryStyles: Record<CategoryType, string> = {
  client: "badge-client",
  prospect_client: "badge-prospect",
  prospect_partner: "badge-prospect",
  partner: "badge-partner",
  influencer: "badge-influencer",
  random: "badge-random",
};

const CategoryBadge = React.forwardRef<HTMLSpanElement, CategoryBadgeProps>(
  ({ className, category, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm",
          categoryStyles[category],
          className
        )}
        {...props}
      >
        {categoryLabels[category]}
      </span>
    );
  }
);
CategoryBadge.displayName = "CategoryBadge";

export { CategoryBadge, type CategoryType };
