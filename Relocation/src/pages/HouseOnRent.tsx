import { useEffect, useMemo, useState } from "react";
import { Building2, ExternalLink, MapPin, Phone, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Carousel, CarouselApi, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

import { loadHouses, HouseItem } from "@/services/datasetsApi";

function getPrimaryImageUrl(item: HouseItem) {
  const images = item.images ?? [];
  return images[0] ?? "";
}

function getStableId(item: HouseItem, index: number) {
  return item.id || item.listingUrl || `house-${item.name ?? "house"}-${item.area ?? ""}-${index}`;
}

const HouseOnRent = () => {
  const [query, setQuery] = useState("");
  const [housesData, setHousesData] = useState<HouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<HouseItem | null>(null);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);

  useEffect(() => {
    async function fetchData() {
      const data = await loadHouses();
      setHousesData(data);
      setLoading(false);
    }
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return housesData;
    return housesData.filter((item) => {
      const name = (item.name ?? "").toLowerCase();
      const area = (item.area ?? "").toLowerCase();
      const desc = (item.description ?? "").toLowerCase();
      return name.includes(q) || area.includes(q) || desc.includes(q);
    });
  }, [query, housesData]);

  useEffect(() => {
    if (!carouselApi || !selected) return;
    const images = selected.images ?? [];
    if (images.length <= 1) return;

    const interval = window.setInterval(() => {
      if (!carouselApi) return;
      if (carouselApi.canScrollNext()) {
        carouselApi.scrollNext();
      } else {
        carouselApi.scrollTo(0);
      }
    }, 2500);

    return () => window.clearInterval(interval);
  }, [carouselApi, selected]);

  return (
    <Card className="border-blue-200 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700">
          <Building2 className="h-5 w-5" />
          Houses on Rent in Coimbatore
        </CardTitle>
        <CardDescription>Browse house-on-rent listings. Click a card for full information and gallery.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex-1">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, area, or address…"
              className="border-blue-200 focus:border-blue-400"
            />
          </div>
          <div className="text-xs text-muted-foreground">
            Showing <span className="font-medium text-foreground">{filtered.length}</span> results
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item, idx) => {
            const primaryImage = getPrimaryImageUrl(item);
            const rating = item.rating ? Number(item.rating) : undefined;

            return (
              <button
                key={getStableId(item, idx)}
                type="button"
                onClick={() => setSelected(item)}
                className="text-left rounded-xl border border-blue-100 bg-white hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
              >
                <div className="relative h-40 w-full bg-gradient-to-br from-blue-50 to-purple-50">
                  {primaryImage ? (
                    <img src={primaryImage} alt={item.name ?? "House"} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">No image</div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {typeof rating === "number" && !Number.isNaN(rating) && (
                      <Badge className="bg-white/90 text-blue-700 border border-blue-100">
                        <Star className="h-3.5 w-3.5 mr-1" />
                        {rating.toFixed(1)}
                      </Badge>
                    )}
                    {item.pricePerMonth && (
                      <Badge className="bg-white/90 text-purple-700 border border-purple-100">{item.pricePerMonth}</Badge>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{item.name ?? "Unnamed listing"}</p>
                    <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                      <MapPin className="h-3.5 w-3.5 text-blue-500" />
                      <span className="truncate">{item.area ?? "Coimbatore"}</span>
                    </p>
                  </div>
                  <p className="text-xs text-gray-700 line-clamp-2">{item.description ?? "Tap to view full details."}</p>
                </div>
              </button>
            );
          })}
        </div>

        <Dialog open={!!selected} onOpenChange={(open) => (!open ? setSelected(null) : undefined)}>
          <DialogContent className="max-w-4xl w-[95vw] sm:w-full">
            {selected && (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                <div className="space-y-3">
                  <DialogHeader>
                    <DialogTitle className="text-xl">{selected.name ?? "House details"}</DialogTitle>
                    <DialogDescription className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{selected.area ?? "Coimbatore"}</span>
                    </DialogDescription>
                  </DialogHeader>

                  <div className="rounded-xl border overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50">
                    <Carousel setApi={(api) => setCarouselApi(api)} opts={{ loop: true }}>
                      <CarouselContent className="py-0">
                        {(selected.images ?? []).map((url, idx) => (
                          <CarouselItem key={`${url}-${idx}`} className="pl-0">
                            <div className="h-64 sm:h-80 w-full">
                              <img src={url} alt={`House photo ${idx + 1}`} className="h-full w-full object-cover" loading="lazy" />
                            </div>
                          </CarouselItem>
                        ))}
                        {(selected.images ?? []).length === 0 && (
                          <CarouselItem className="pl-0">
                            <div className="h-64 sm:h-80 w-full flex items-center justify-center text-sm text-muted-foreground">
                              No photos available
                            </div>
                          </CarouselItem>
                        )}
                      </CarouselContent>
                      <CarouselPrevious className="left-3" />
                      <CarouselNext className="right-3" />
                    </Carousel>
                  </div>

                  <div className="text-sm text-gray-700 leading-relaxed">{selected.description ?? "No description available."}</div>

                  {selected.listingUrl && (
                    <div className="flex flex-wrap gap-2">
                      <Button asChild className="gap-2">
                        <a href={selected.listingUrl} target="_blank" rel="noreferrer">
                          View listing <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      {selected.latitude && selected.longitude && (
                        <Button variant="outline" asChild className="gap-2 border-blue-200">
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              `${selected.latitude},${selected.longitude}`,
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View on map <MapPin className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-blue-100 bg-white p-4 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {selected.pricePerMonth && <Badge className="bg-blue-50 text-blue-700 border border-blue-100">{selected.pricePerMonth}</Badge>}
                    {selected.roomType && <Badge variant="secondary">{selected.roomType}</Badge>}
                  </div>

                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Rating</span>
                      <span className="font-medium">
                        {selected.rating ?? "NA"} {selected.reviewCount ? `(${selected.reviewCount} reviews)` : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Distance to city center</span>
                      <span className="font-medium">
                        {typeof selected.distanceToCityCenterKm === "number" ? `${selected.distanceToCityCenterKm} km` : "NA"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Contact</span>
                      <span className="font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4 text-blue-500" />
                        {selected.contactNumber ?? "NA"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default HouseOnRent;

