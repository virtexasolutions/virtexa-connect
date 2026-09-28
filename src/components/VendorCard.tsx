import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Star, BadgeCheck, MapPin, Phone, ArrowRight } from "lucide-react";
import { categoryIcons } from "@/lib/icons";
import type { CategoryMeta, Vendor } from "@/data/vendors";

interface VendorCardProps {
  vendor: Vendor;
  category: CategoryMeta;
}

export function VendorCard({ vendor, category }: VendorCardProps) {
  const Icon = categoryIcons[category.icon] ?? categoryIcons.Building2;

  return (
    <Link
      to={`/vendor/${vendor.id}`}
      className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
    >
      <Card className="group flex h-full flex-col overflow-hidden border-border/70 bg-card transition-all hover:border-primary/50 hover:shadow-lg">
        <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary border border-primary/20">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate font-display text-base font-semibold leading-tight text-foreground group-hover:text-primary transition-colors">
                {vendor.name}
              </h3>
              {vendor.verified && (
                <BadgeCheck
                  className="h-4 w-4 shrink-0 text-primary"
                  aria-label="Virtexa Partner Badge"
                />
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 text-primary/80" />
              {vendor.city}, {vendor.state}
            </div>
            {vendor.verified ? (
              <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                Virtexa Partner Badge
              </span>
            ) : (
              <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {vendor.claimed ? "Free Listing" : "Unclaimed Listing"}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 space-y-3 pb-3">
          {vendor.bio && (
            <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
              {vendor.bio}
            </p>
          )}

          <div className="flex flex-wrap gap-1.5">
            {vendor.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="font-normal bg-secondary/80 text-foreground border border-border/50"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t border-border/60 pt-3">
          <div className="flex items-center gap-1.5">
            {vendor.rating != null ? (
              <>
                <Star className="h-4 w-4 fill-primary/80 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  {vendor.rating}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({vendor.reviewCount ?? 0})
                </span>
                {vendor.yearsActive != null && (
                  <>
                    <span className="mx-1 text-border">·</span>
                    <span className="text-xs text-muted-foreground">
                      {vendor.yearsActive} yrs
                    </span>
                  </>
                )}
              </>
            ) : vendor.yearsActive != null ? (
              <span className="text-xs text-muted-foreground">
                {vendor.yearsActive} years in business
              </span>
            ) : null}
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
            View Profile <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
