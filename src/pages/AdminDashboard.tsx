import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Users, Home, CreditCard, CheckCircle, Trash2, ShieldCheck } from "lucide-react";

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const [profilesRes, rolesRes, listingsRes, paymentsRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
      supabase.from("pg_listings").select("*, profiles(full_name, email)").order("created_at", { ascending: false }),
      supabase.from("payments").select("*, profiles(full_name, email), pg_listings(title)").order("created_at", { ascending: false }),
    ]);

    const rolesMap: Record<string, string> = {};
    (rolesRes.data || []).forEach((r: any) => { rolesMap[r.user_id] = r.role; });

    setUsers((profilesRes.data || []).map((p: any) => ({ ...p, role: rolesMap[p.id] || "user" })));
    setListings(listingsRes.data || []);
    setPayments(paymentsRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleVerify = async (id: string) => {
    const { error } = await supabase.from("pg_listings").update({ verified: true }).eq("id", id);
    if (error) toast.error("Failed to verify");
    else { toast.success("Listing verified"); fetchAll(); }
  };

  const handleDeleteListing = async (id: string) => {
    if (!confirm("Delete this listing?")) return;
    const { error } = await supabase.from("pg_listings").delete().eq("id", id);
    if (error) toast.error("Delete failed: " + error.message);
    else { toast.success("Listing deleted"); fetchAll(); }
  };

  if (loading) return <div className="container mx-auto px-4 py-8"><Skeleton className="h-[400px] rounded-lg" /></div>;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 animate-fade-in">
      <h1 className="font-display text-3xl font-bold flex items-center gap-2">
        <ShieldCheck className="h-8 w-8 text-primary" /> Admin Dashboard
      </h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-primary">{users.length}</p><p className="text-sm text-muted-foreground">Total Users</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-primary">{listings.length}</p><p className="text-sm text-muted-foreground">Total Listings</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-primary">{payments.length}</p><p className="text-sm text-muted-foreground">Total Payments</p></CardContent></Card>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users" className="gap-1.5"><Users className="h-4 w-4" /> Users</TabsTrigger>
          <TabsTrigger value="listings" className="gap-1.5"><Home className="h-4 w-4" /> Listings</TabsTrigger>
          <TabsTrigger value="payments" className="gap-1.5"><CreditCard className="h-4 w-4" /> Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {users.map((u: any) => (
              <Card key={u.id}>
                <CardContent className="p-4 space-y-1">
                  <p className="font-medium">{u.full_name || "—"}</p>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                  <Badge variant={u.role === "admin" ? "default" : u.role === "pg_owner" ? "secondary" : "outline"} className="capitalize">{u.role}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="listings" className="mt-4">
          <div className="space-y-3">
            {listings.map((l: any) => (
              <Card key={l.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{l.title}</p>
                    <p className="text-sm text-muted-foreground">{l.location} · ₹{l.price?.toLocaleString()}/mo · Owner: {l.profiles?.full_name || l.profiles?.email || "—"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {l.verified ? (
                      <Badge className="bg-success text-success-foreground">Verified</Badge>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleVerify(l.id)} className="gap-1">
                        <CheckCircle className="h-4 w-4" /> Verify
                      </Button>
                    )}
                    <Button size="icon" variant="destructive" onClick={() => handleDeleteListing(l.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {listings.length === 0 && <p className="text-muted-foreground text-center py-8">No listings yet.</p>}
          </div>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <div className="space-y-3">
            {payments.map((p: any) => (
              <Card key={p.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{p.profiles?.full_name || p.profiles?.email || "User"}</p>
                    <p className="text-sm text-muted-foreground">
                      {p.pg_listings?.title || "PG"} · Room {p.room_number || "—"} · ₹{p.amount}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</p>
                  </div>
                  <Badge variant={p.status === "paid" ? "default" : "secondary"} className="capitalize">{p.status}</Badge>
                </CardContent>
              </Card>
            ))}
            {payments.length === 0 && <p className="text-muted-foreground text-center py-8">No payments yet.</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
