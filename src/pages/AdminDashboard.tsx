import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Building2, Users, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type ListingWithOwner = Tables<"pg_listings"> & { profiles: { full_name: string | null; email: string | null } | null };

export default function AdminDashboard() {
  const [listings, setListings] = useState<ListingWithOwner[]>([]);
  const [users, setUsers] = useState<(Tables<"profiles"> & { user_roles: Tables<"user_roles">[] })[]>([]);
  const [reviews, setReviews] = useState<(Tables<"reviews"> & { profiles: { full_name: string | null } | null })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [listingsRes, usersRes, reviewsRes] = await Promise.all([
      supabase.from("pg_listings").select("*, profiles!pg_listings_owner_id_fkey(full_name, email)").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*, user_roles(*)"),
      supabase.from("reviews").select("*, profiles(full_name)").order("created_at", { ascending: false }),
    ]);
    if (listingsRes.data) setListings(listingsRes.data as ListingWithOwner[]);
    if (usersRes.data) setUsers(usersRes.data as any);
    if (reviewsRes.data) setReviews(reviewsRes.data as any);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const verifyListing = async (id: string, verified: boolean) => {
    const { error } = await supabase.from("pg_listings").update({ verified }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(verified ? "Listing approved" : "Listing rejected");
    fetchData();
  };

  const deleteListing = async (id: string) => {
    const { error } = await supabase.from("pg_listings").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Listing removed");
    fetchData();
  };

  const pendingCount = listings.filter((l) => !l.verified).length;

  if (loading) {
    return <div className="min-h-screen pt-20 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="min-h-screen pt-16 pb-24 md:pb-8">
      <div className="container py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mb-6">Manage the entire platform</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <Building2 className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="font-display text-xl font-bold text-foreground">{listings.length}</p>
              <p className="text-xs text-muted-foreground">Total PGs</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <Users className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="font-display text-xl font-bold text-foreground">{users.length}</p>
              <p className="text-xs text-muted-foreground">Users</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <Star className="w-5 h-5 text-warning mx-auto mb-1" />
              <p className="font-display text-xl font-bold text-foreground">{reviews.length}</p>
              <p className="text-xs text-muted-foreground">Reviews</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <XCircle className="w-5 h-5 text-destructive mx-auto mb-1" />
              <p className="font-display text-xl font-bold text-foreground">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>

          <Tabs defaultValue="listings">
            <TabsList className="bg-secondary mb-4">
              <TabsTrigger value="listings">PG Listings</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="listings">
              <div className="space-y-3">
                {listings.map((listing) => (
                  <div key={listing.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-foreground text-sm truncate">{listing.title}</h3>
                      <p className="text-xs text-muted-foreground">{listing.location} · ₹{listing.price.toLocaleString()} · Owner: {listing.profiles?.full_name || listing.profiles?.email || "Unknown"}</p>
                    </div>
                    <Badge variant={listing.verified ? "default" : "secondary"} className={listing.verified ? "bg-success text-success-foreground" : ""}>
                      {listing.verified ? "Verified" : "Pending"}
                    </Badge>
                    <div className="flex gap-1">
                      {!listing.verified && (
                        <Button size="sm" variant="ghost" onClick={() => verifyListing(listing.id, true)} className="text-success hover:text-success">
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      )}
                      {listing.verified && (
                        <Button size="sm" variant="ghost" onClick={() => verifyListing(listing.id, false)} className="text-warning hover:text-warning">
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => deleteListing(listing.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {listings.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No listings yet</p>}
              </div>
            </TabsContent>

            <TabsContent value="users">
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-secondary">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Phone</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Role</th>
                  </tr></thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 text-foreground">{u.full_name || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{u.email || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{u.phone || "—"}</td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="capitalize">{u.user_roles?.[0]?.role || "user"}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="reviews">
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div key={r.id} className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">{r.profiles?.full_name || "User"}</span>
                      <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1 mb-1">
                      {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="w-3 h-3 fill-warning text-warning" />)}
                    </div>
                    <p className="text-sm text-muted-foreground">{r.comment}</p>
                  </div>
                ))}
                {reviews.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No reviews yet</p>}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
