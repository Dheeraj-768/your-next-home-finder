import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("bookings")
      .select("*, pg_listings(title, location)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setBookings(data);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [user]);

  const handleCancel = async (id: string) => {
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    if (error) toast.error("Cancel failed");
    else { toast.success("Booking cancelled"); fetch(); }
  };

  if (loading) return <div className="container mx-auto px-4 py-8"><Skeleton className="h-[300px] rounded-lg" /></div>;

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <h1 className="font-display text-3xl font-bold mb-6">My Bookings</h1>
      {bookings.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg mb-4">No bookings yet.</p>
          <Link to="/listings"><Button>Browse PGs</Button></Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bookings.map(b => (
            <Card key={b.id}>
              <CardContent className="p-5 space-y-2">
                <Link to={`/pg/${b.pg_id}`} className="font-display font-semibold text-lg hover:text-primary transition-colors">
                  {b.pg_listings?.title || "PG"}
                </Link>
                <p className="text-sm text-muted-foreground">{b.pg_listings?.location}</p>
                {b.visit_date && <p className="text-sm">Visit: {b.visit_date} {b.visit_time}</p>}
                <div className="flex items-center justify-between">
                  <Badge variant={b.status === "confirmed" ? "default" : "secondary"}>{b.status}</Badge>
                  <Button variant="ghost" size="icon" onClick={() => handleCancel(b.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}