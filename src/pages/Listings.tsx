import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PGCard from "@/components/PGCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

type Listing = {
  id: string;
  title: string;
  location: string;
  price: number;
  gender: string | null;
  vacancies: number | null;
  wifi: boolean | null;
  food: boolean | null;
  ac: boolean | null;
  water: boolean | null;
};

type ImageRow = { pg_id: string; image_url: string; is_360: boolean | null };

export default function Listings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [images, setImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("pg_listings")
        .select("id, title, location, price, gender, vacancies, wifi, food, ac, water")
        .eq("verified", true)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setListings(data);
        const ids = data.map(d => d.id);
        if (ids.length) {
          const { data: imgs } = await supabase
            .from("pg_images")
            .select("pg_id, image_url, is_360")
            .in("pg_id", ids)
            .eq("is_360", false);
          if (imgs) {
            const map: Record<string, string> = {};
            (imgs as ImageRow[]).forEach(i => { if (!map[i.pg_id]) map[i.pg_id] = i.image_url; });
            setImages(map);
          }
        }
      }
      setLoading(false);
    })();
  }, []);

  const filtered = listings.filter(l => {
    if (search && !l.title.toLowerCase().includes(search.toLowerCase()) && !l.location.toLowerCase().includes(search.toLowerCase())) return false;
    if (genderFilter !== "all" && l.gender !== genderFilter) return false;
    if (maxPrice && l.price > parseFloat(maxPrice)) return false;
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold mb-6">Browse PG Listings</h1>

      <div className="flex flex-wrap gap-3 mb-8">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or location..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={genderFilter} onValueChange={setGenderFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Gender" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="co-ed">Co-Ed</SelectItem>
          </SelectContent>
        </Select>
        <Input type="number" placeholder="Max rent" className="w-[140px]" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-[320px] rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-20 text-lg">No PG listings found. Try adjusting your filters.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(l => (
            <PGCard key={l.id} {...l} imageUrl={images[l.id]} />
          ))}
        </div>
      )}
    </div>
  );
}