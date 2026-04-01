import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, CheckCircle2, Clock, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type ListingWithImages = Tables<"pg_listings"> & { pg_images: Tables<"pg_images">[] };

export default function OwnerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<ListingWithImages[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("pg_listings")
      .select("*, pg_images(*)")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setListings(data as ListingWithImages[]);
        setLoading(false);
      });
  }, [user]);

  const verified = listings.filter((l) => l.verified);
  const pending = listings.filter((l) => !l.verified);

  return (
    <div className="min-h-screen pt-16 pb-24 md:pb-8">
      <div className="container py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">Owner Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage your PG listings</p>
            </div>
            <Button onClick={() => navigate("/owner/create")} className="gradient-primary text-primary-foreground shadow-glow">
              <Plus className="w-4 h-4 mr-2" /> Add PG
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-card rounded-xl border border-border p-5 text-center">
              <Building2 className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="font-display text-2xl font-bold text-foreground">{listings.length}</p>
              <p className="text-xs text-muted-foreground">Total Listings</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-5 text-center">
              <CheckCircle2 className="w-6 h-6 text-success mx-auto mb-2" />
              <p className="font-display text-2xl font-bold text-foreground">{verified.length}</p>
              <p className="text-xs text-muted-foreground">Verified</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-5 text-center">
              <Clock className="w-6 h-6 text-warning mx-auto mb-2" />
              <p className="font-display text-2xl font-bold text-foreground">{pending.length}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : listings.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-xl border border-border">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-display font-semibold text-foreground mb-1">No listings yet</p>
              <p className="text-sm text-muted-foreground mb-4">Create your first PG listing to get started</p>
              <Button onClick={() => navigate("/owner/create")} className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" /> Create Listing</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map((listing) => (
                <div key={listing.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                  <div className="w-16 h-12 rounded-lg overflow-hidden bg-secondary shrink-0">
                    {listing.pg_images?.[0] && <img src={listing.pg_images[0].image_url} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-foreground text-sm truncate">{listing.title}</h3>
                    <p className="text-xs text-muted-foreground">{listing.location} · ₹{listing.price.toLocaleString()}/mo</p>
                  </div>
                  <Badge variant={listing.verified ? "default" : "secondary"} className={listing.verified ? "bg-success text-success-foreground" : ""}>
                    {listing.verified ? "Verified" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
