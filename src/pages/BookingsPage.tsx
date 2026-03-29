import { sampleBookings } from "@/data/mockData";
import { Calendar, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

const statusConfig = {
  confirmed: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", label: "Confirmed" },
  pending: { icon: Loader2, color: "text-warning", bg: "bg-warning/10", label: "Pending" },
  rejected: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Rejected" },
};

export default function BookingsPage() {
  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8">
      <div className="container">
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">Your Bookings</h1>
        <p className="text-sm text-muted-foreground mb-6">{sampleBookings.length} visit bookings</p>

        <div className="space-y-3">
          {sampleBookings.map((booking) => {
            const status = statusConfig[booking.status];
            const Icon = status.icon;
            return (
              <div key={booking.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg ${status.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${status.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/pg/${booking.pgId}`} className="font-display font-semibold text-foreground text-sm hover:text-primary transition-colors">
                    {booking.pgName}
                  </Link>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" /> {booking.date}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" /> {booking.time}
                    </span>
                  </div>
                </div>
                <span className={`text-xs font-semibold ${status.color} ${status.bg} px-2.5 py-1 rounded-full`}>
                  {status.label}
                </span>
              </div>
            );
          })}
        </div>

        {sampleBookings.length === 0 && (
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
