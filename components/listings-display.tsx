"use client";

import { memo } from "react";
import type { ListingsResponse } from "@/lib/types/listings";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

type ListingsDisplayProps = {
  listings: ListingsResponse["listings"];
};

function PureListingsDisplay({ listings }: ListingsDisplayProps) {
  if (!listings || listings.length === 0) {
    return null;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatAddress = (address: ListingsResponse["listings"][number]["address"]) => {
    return `${address.street}, ${address.city}, ${address.state} ${address.zip}`;
  };

  const buildZillowUrl = (address: ListingsResponse["listings"][number]["address"]) => {
    // Build a Zillow search URL from the address
    // Format: https://www.zillow.com/homes/[address]-[city]-[state]-[zip]_rb/
    const addressParts = [
      address.street,
      address.city,
      address.state,
      address.zip,
    ]
      .filter(Boolean)
      .map((part) => encodeURIComponent(part.replace(/\s+/g, "-")))
      .join("-");

    return `https://www.zillow.com/homes/${addressParts}_rb/`;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="text-muted-foreground text-sm">
        Found {listings.length} {listings.length === 1 ? "property" : "properties"}
      </div>
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
        {listings.map((listing, index) => {
          const zillowUrl = buildZillowUrl(listing.address);

          return (
            <Card
              key={index}
              className={cn(
                "overflow-hidden transition-all",
                "hover:shadow-lg hover:border-primary/50 cursor-pointer"
              )}
              onClick={() => {
                window.open(zillowUrl, "_blank", "noopener,noreferrer");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  window.open(zillowUrl, "_blank", "noopener,noreferrer");
                }
              }}
              role="button"
              tabIndex={0}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-semibold">
                    {formatPrice(listing.price)}
                  </CardTitle>
                  <Badge
                    variant={listing.availability ? "default" : "secondary"}
                    className="shrink-0"
                  >
                    {listing.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-muted-foreground text-sm">
                  {formatAddress(listing.address)}
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{listing.beds}</span>
                    <span className="text-muted-foreground">
                      {listing.beds === 1 ? "bed" : "beds"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{listing.baths}</span>
                    <span className="text-muted-foreground">
                      {listing.baths === 1 ? "bath" : "baths"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">
                      {new Intl.NumberFormat("en-US").format(listing.sqft)}
                    </span>
                    <span className="text-muted-foreground">sq ft</span>
                  </div>
                </div>
                <div className="text-muted-foreground text-xs pt-2 border-t">
                  Click to view on Zillow
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export const ListingsDisplay = memo(PureListingsDisplay);

