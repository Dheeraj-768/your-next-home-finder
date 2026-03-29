import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { allFacilities, cities } from "@/data/mockData";
import { motion, AnimatePresence } from "framer-motion";

export interface Filters {
  search: string;
  city: string;
  minRent: number;
  maxRent: number;
  gender: string;
  facilities: string[];
}

const defaultFilters: Filters = {
  search: "",
  city: "",
  minRent: 0,
  maxRent: 20000,
  gender: "",
  facilities: [],
};

export default function SearchFilters({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
}) {
  const [showFilters, setShowFilters] = useState(false);

  const activeCount = [
    filters.city,
    filters.gender,
    filters.minRent > 0 ? "min" : "",
    filters.maxRent < 20000 ? "max" : "",
    ...filters.facilities,
  ].filter(Boolean).length;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search PG name or location..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
            showFilters || activeCount > 0
              ? "gradient-primary text-primary-foreground border-transparent"
              : "bg-card border-border text-foreground hover:bg-secondary"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary-foreground text-primary text-xs flex items-center justify-center font-bold">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card rounded-xl border border-border p-4 space-y-4">
              {/* City */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">City</label>
                <div className="flex flex-wrap gap-2">
                  {cities.map((c) => (
                    <button
                      key={c}
                      onClick={() => onChange({ ...filters, city: filters.city === c ? "" : c })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        filters.city === c
                          ? "gradient-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-accent"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Gender</label>
                <div className="flex gap-2">
                  {["male", "female", "co-ed"].map((g) => (
                    <button
                      key={g}
                      onClick={() => onChange({ ...filters, gender: filters.gender === g ? "" : g })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                        filters.gender === g
                          ? "gradient-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-accent"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Budget: ₹{filters.minRent.toLocaleString()} - ₹{filters.maxRent.toLocaleString()}
                </label>
                <div className="flex gap-3">
                  <input
                    type="range"
                    min={0}
                    max={20000}
                    step={500}
                    value={filters.minRent}
                    onChange={(e) => onChange({ ...filters, minRent: +e.target.value })}
                    className="flex-1 accent-primary"
                  />
                  <input
                    type="range"
                    min={0}
                    max={20000}
                    step={500}
                    value={filters.maxRent}
                    onChange={(e) => onChange({ ...filters, maxRent: +e.target.value })}
                    className="flex-1 accent-primary"
                  />
                </div>
              </div>

              {/* Facilities */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Facilities</label>
                <div className="flex flex-wrap gap-2">
                  {allFacilities.map((f) => (
                    <button
                      key={f}
                      onClick={() =>
                        onChange({
                          ...filters,
                          facilities: filters.facilities.includes(f)
                            ? filters.facilities.filter((x) => x !== f)
                            : [...filters.facilities, f],
                        })
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        filters.facilities.includes(f)
                          ? "gradient-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-accent"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear */}
              {activeCount > 0 && (
                <button
                  onClick={() => onChange(defaultFilters)}
                  className="flex items-center gap-1 text-xs text-destructive hover:underline"
                >
                  <X className="w-3 h-3" /> Clear all filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { defaultFilters };
