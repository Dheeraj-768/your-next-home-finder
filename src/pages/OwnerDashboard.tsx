import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AddPropertyForm from "@/components/AddPropertyForm";
import ImageUpload from "@/components/ImageUpload";
import { toast } from "sonner";
import { Plus, Trash2, ImageIcon, Calendar, Bell, BellDot } from "lucide-react";

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [images, setImages] = useState<Record<string, any[]>>({});
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [uploadPgId, setUploadPgId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const { data: pgs } = await supabase
      .from("pg_listings")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (pgs) {
      setListings(pgs);
      const ids = pgs.map(p => p.id);
      if (ids.length) {
        const [imgRes, bkRes] = await Promise.all([
          supabase.from("pg_images").select("*").in("pg_id", ids),
          supabase.from("bookings").select("*, profiles(full_name, email, phone)").in("pg_id", ids).order("created_at", { ascending: false }),
        ]);
        if (imgRes.data) {
          const map: Record<string, any[]> = {};
          imgRes.data.forEach(i => { (map[i.pg_id] = map[i.pg_id] || []).push(i); });
          setImages(map);
        }
        if (bkRes.data) setBookings(bkRes.data);
      }
    }

    // Fetch notifications
    const { data: notifs } = await supabase
      .from("notifications")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });
    if (notifs) setNotifications(notifs);

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  // Realtime notifications
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("owner-notifications")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `owner_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications(prev => [payload.new as any, ...prev]);
        toast.info("New payment notification!");
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this property?")) return;
    const { error } = await supabase.from("pg_listings").delete().eq("id", id);
    if (error) toast.error("Delete failed: " + error.message);
    else { toast.success("Property deleted"); fetchData(); }
  };

  const handleDeleteImage = async (imgId: string) => {
    const { error } = await supabase.from("pg_images").delete().eq("id", imgId);
    if (error) toast.error("Failed to delete image");
    else { toast.success("Image deleted"); fetchData(); }
  };

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  if (loading) return <div className="container mx-auto px-4 py-8"><Skeleton className="h-[400px] rounded-lg" /></div>;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Owner Dashboard</h1>
        <Button onClick={() => setShowAdd(true)} className="gradient-primary text-primary-foreground gap-1.5">
          <Plus className="h-4 w-4" /> Add Property
        </Button>
      </div>

      {showAdd && (
        <Card>
          <CardHeader><CardTitle>New Property</CardTitle></CardHeader>
          <CardContent>
            <AddPropertyForm onSuccess={() => { setShowAdd(false); fetchData(); }} onCancel={() => setShowAdd(false)} />
          </CardContent>
        </Card>
      )}

      {/* Payment Notifications */}
      <div>
        <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
          {unreadCount > 0 ? <BellDot className="h-5 w-5 text-warning" /> : <Bell className="h-5 w-5" />}
          Payment Notifications
          {unreadCount > 0 && <Badge className="bg-warning text-warning-foreground">{unreadCount} new</Badge>}
        </h2>
        {notifications.length === 0 ? (
          <p className="text-muted-foreground">No payment notifications yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {notifications.map((n: any) => (
              <Card key={n.id} className={!n.is_read ? "border-warning/50 bg-warning/5" : ""}>
                <CardContent className="p-4 text-sm space-y-1">
                  <p className="font-medium">{n.message}</p>
                  <p className="text-muted-foreground text-xs">{new Date(n.created_at).toLocaleString()}</p>
                  {!n.is_read && (
                    <Button size="sm" variant="ghost" onClick={() => markRead(n.id)} className="text-xs">
                      Mark as read
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Listings */}
      <div>
        <h2 className="font-display text-xl font-semibold mb-4">Your Properties ({listings.length})</h2>
        {listings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">You haven't added any properties yet.</p>
              <Button onClick={() => setShowAdd(true)} className="gradient-primary text-primary-foreground gap-1.5">
                <Plus className="h-4 w-4" /> Add Your First Property
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {listings.map(pg => (
              <Card key={pg.id}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display font-semibold text-lg">{pg.title}</h3>
                      <p className="text-sm text-muted-foreground">{pg.location} · ₹{pg.price?.toLocaleString()}/mo</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {pg.verified ? <Badge className="bg-success text-success-foreground">Verified</Badge> : <Badge variant="secondary">Pending</Badge>}
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(pg.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Images */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium flex items-center gap-1"><ImageIcon className="h-4 w-4" /> Images</h4>
                      <Button variant="outline" size="sm" onClick={() => setUploadPgId(uploadPgId === pg.id ? null : pg.id)}>
                        {uploadPgId === pg.id ? "Close Upload" : "Upload Images"}
                      </Button>
                    </div>
                    {uploadPgId === pg.id && <ImageUpload pgId={pg.id} onUploaded={fetchData} />}
                    {(images[pg.id] || []).length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-2">
                        {(images[pg.id] || []).map((img: any) => (
                          <div key={img.id} className="relative group">
                            <img src={img.image_url} alt="" className="h-20 w-28 object-cover rounded-md border" />
                            {img.is_360 && <Badge className="absolute top-1 left-1 text-[10px] px-1 py-0">360°</Badge>}
                            <button onClick={() => handleDeleteImage(img.id)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Bookings */}
      <div>
        <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2"><Calendar className="h-5 w-5" /> Booking Requests ({bookings.length})</h2>
        {bookings.length === 0 ? (
          <p className="text-muted-foreground">No booking requests yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {bookings.map((b: any) => (
              <Card key={b.id}>
                <CardContent className="p-4 text-sm space-y-1">
                  <p className="font-medium">{b.profiles?.full_name || "User"}</p>
                  <p className="text-muted-foreground">{b.profiles?.email}</p>
                  {b.visit_date && <p>Visit: {b.visit_date} {b.visit_time}</p>}
                  <Badge variant={b.status === "confirmed" ? "default" : "secondary"}>{b.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
