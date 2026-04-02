import { useState, useEffect } from "react";
import { Calendar, Clock, Building2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface BookingWithPG {
  id: string;
  pg_id: string;
  phone: string | null;
  created_at: string;
  pg_listings: { title: string; location: string } | null;
}

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithPG[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("bookings")
      .select("*, pg_listings(title, location)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setBookings(data as BookingWithPG[]);
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8">
      <div className="container">
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">Your Bookings</h1>
        <p className="text-sm text-muted-foreground mb-6">{bookings.length} bookings</p>

        <div className="space-y-3">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/pg/${booking.pg_id}`} className="font-display font-semibold text-foreground text-sm hover:text-primary transition-colors">
                  {booking.pg_listings?.title ?? "PG"}
                </Link>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" /> {new Date(booking.created_at).toLocaleDateString()}
                  </span>
                  {booking.phone && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" /> {booking.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {bookings.length === 0 && (
          <div className="text-center py-20">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-display font-semibold text-foreground mb-1">No bookings yet</p>
            <p className="text-sm text-muted-foreground">Book a visit to a PG to see it here</p>
          </div>
        )}
      </div>
    </div>
  );
}
