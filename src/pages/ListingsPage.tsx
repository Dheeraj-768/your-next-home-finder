import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import PGCard from "@/components/PGCard";
import SearchFilters, { defaultFilters, type Filters } from "@/components/SearchFilters";
import type { Tables } from "@/integrations/supabase/types";

type PGWithImages = Tables<"pg_listings"> & { pg_images: Tables<"pg_images">[] };

export default function ListingsPage() {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [listings, setListings] = useState<PGWithImages[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      const { data, error } = await supabase
        .from("pg_listings")
        .select("*, pg_images(*)")
        .eq("verified", true);
      if (!error && data) setListings(data as PGWithImages[]);
      setLoading(false);
    };
    fetchListings();
  }, []);

  const filtered = listings.filter((pg) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!pg.title.toLowerCase().includes(q) && !pg.location.toLowerCase().includes(q)) return false;
    }
    if (filters.city && !pg.location.toLowerCase().includes(filters.city.toLowerCase())) return false;
    if (filters.gender && pg.gender !== filters.gender) return false;
    if (pg.price < filters.minRent || pg.price > filters.maxRent) return false;
    if (filters.facilities.length > 0 && !filters.facilities.every((f) => (pg.amenities ?? []).includes(f))) return false;
    return true;
  });

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8">
      <div className="container">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">Explore PGs</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} listings available</p>
        </div>
        <SearchFilters filters={filters} onChange={setFilters} />
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
              {filtered.map((pg, i) => (
                <PGCard key={pg.id} pg={pg} index={i} />
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-16">
                <p className="text-lg font-display font-semibold text-foreground mb-2">No PGs found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
