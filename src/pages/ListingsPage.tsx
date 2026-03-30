import { useState, useMemo } from "react";
import { getApprovedListings } from "@/data/listingsStore";
import PGCard from "@/components/PGCard";
import SearchFilters, { defaultFilters, type Filters } from "@/components/SearchFilters";

export default function ListingsPage() {
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  const filtered = useMemo(() => {
    return pgListings.filter((pg) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!pg.name.toLowerCase().includes(q) && !pg.location.toLowerCase().includes(q)) return false;
      }
      if (filters.city && pg.city !== filters.city) return false;
      if (filters.gender && pg.gender !== filters.gender) return false;
      if (pg.rent < filters.minRent || pg.rent > filters.maxRent) return false;
      if (filters.facilities.length > 0 && !filters.facilities.every((f) => pg.facilities.includes(f))) return false;
      return true;
    });
  }, [filters]);

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8">
      <div className="container">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">Explore PGs</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} listings available</p>
        </div>

        <SearchFilters filters={filters} onChange={setFilters} />

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
      </div>
    </div>
  );
}
