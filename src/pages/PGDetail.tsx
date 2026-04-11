import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import PanoramaViewer from "@/components/PanoramaViewer";
import { toast } from "sonner";
import { MapPin, Wifi, Utensils, Wind, Droplets, Star, Loader2, CalendarDays } from "lucide-react";

export default function PGDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [pg, setPg] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState(0);
  const [booking, setBooking] = useState({ date: "", time: "", phone: "" });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [hasBooked, setHasBooked] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [pgRes, imgRes, revRes] = await Promise.all([
        supabase.from("pg_listings").select("*").eq("id", id).single(),
        supabase.from("pg_images").select("*").eq("pg_id", id).order("created_at"),
        supabase.from("reviews").select("*, profiles(full_name)").eq("pg_id", id).order("created_at", { ascending: false }),
      ]);
      if (pgRes.data) setPg(pgRes.data);
      if (imgRes.data) setImages(imgRes.data);
      if (revRes.data) setReviews(revRes.data);

      if (user) {
        const { data: bk } = await supabase.from("bookings").select("id").eq("user_id", user.id).eq("pg_id", id).limit(1);
        if (bk && bk.length > 0) setHasBooked(true);
      }
      setLoading(false);
    })();
  }, [id, user]);

  const regularImages = images.filter(i => !i.is_360);
  const panoramaImage = images.find(i => i.is_360);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate("/auth"); return; }
    setBookingLoading(true);
    const { error } = await supabase.from("bookings").insert({
      user_id: user.id,
      pg_id: id!,
      visit_date: booking.date,
      visit_time: booking.time,
      phone: booking.phone,
    });
    setBookingLoading(false);
    if (error) toast.error("Booking failed: " + error.message);
    else { toast.success("Visit booked!"); setHasBooked(true); }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate("/auth"); return; }
    setReviewLoading(true);
    const { error } = await supabase.from("reviews").insert({
      user_id: user.id,
      pg_id: id!,
      rating: reviewForm.rating,
      comment: reviewForm.comment,
    });
    setReviewLoading(false);
    if (error) toast.error("Review failed: " + error.message);
    else {
      toast.success("Review submitted!");
      const { data } = await supabase.from("reviews").select("*, profiles(full_name)").eq("pg_id", id!).order("created_at", { ascending: false });
      if (data) setReviews(data);
      setReviewForm({ rating: 5, comment: "" });
    }
  };

  if (loading) return <div className="container mx-auto px-4 py-8"><Skeleton className="h-[500px] rounded-lg" /></div>;
  if (!pg) return <div className="container mx-auto px-4 py-20 text-center text-lg text-muted-foreground">PG not found.</div>;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Image Gallery */}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="aspect-video rounded-lg overflow-hidden bg-muted">
          {regularImages.length > 0 ? (
            <img src={regularImages[selectedImg]?.image_url} alt={pg.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">No images yet</div>
          )}
        </div>
        <div className="grid grid-cols-3 lg:grid-cols-1 gap-2">
          {regularImages.slice(0, 3).map((img: any, idx: number) => (
            <button key={img.id} onClick={() => setSelectedImg(idx)} className={`aspect-video rounded-md overflow-hidden border-2 transition-colors ${selectedImg === idx ? "border-primary" : "border-transparent"}`}>
              <img src={img.image_url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* 360° Viewer */}
      {panoramaImage && (
        <div>
          <h2 className="font-display text-xl font-semibold mb-3">360° Room View</h2>
          <PanoramaViewer url={panoramaImage.image_url} />
        </div>
      )}

      {/* Info */}
      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-3xl font-bold">{pg.title}</h1>
            <p className="flex items-center gap-1 text-muted-foreground mt-1"><MapPin className="h-4 w-4" /> {pg.location}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {pg.wifi && <Badge className="gap-1"><Wifi className="h-3 w-3" />WiFi</Badge>}
            {pg.food && <Badge className="gap-1"><Utensils className="h-3 w-3" />Food</Badge>}
            {pg.ac && <Badge className="gap-1"><Wind className="h-3 w-3" />AC</Badge>}
            {pg.water && <Badge className="gap-1"><Droplets className="h-3 w-3" />Water</Badge>}
            {pg.gender && <Badge variant="secondary" className="capitalize">{pg.gender}</Badge>}
            {pg.occupancy && <Badge variant="outline">{pg.occupancy}</Badge>}
          </div>
          <p className="text-foreground/80 leading-relaxed">{pg.description}</p>

          {/* Reviews */}
          <div>
            <h2 className="font-display text-xl font-semibold mb-4">Reviews ({reviews.length})</h2>
            {reviews.length === 0 ? (
              <p className="text-muted-foreground">No reviews yet.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((r: any) => (
                  <Card key={r.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {(r.profiles?.full_name || "U")[0].toUpperCase()}
                        </div>
                        <span className="font-medium">{r.profiles?.full_name || "User"}</span>
                        <div className="flex items-center gap-0.5 ml-auto text-warning">
                          <Star className="h-4 w-4 fill-current" /> {r.rating}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{r.comment}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {/* Review form - only if user has booked */}
            {user && hasBooked && role === "user" && (
              <form onSubmit={handleReview} className="mt-6 space-y-3">
                <h3 className="font-semibold">Write a Review</h3>
                <div className="flex items-center gap-3">
                  <Label>Rating</Label>
                  <Input type="number" min={1} max={5} className="w-20" value={reviewForm.rating} onChange={e => setReviewForm(f => ({ ...f, rating: parseInt(e.target.value) || 1 }))} />
                </div>
                <Textarea placeholder="Your review..." value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))} />
                <Button type="submit" size="sm" disabled={reviewLoading}>
                  {reviewLoading && <Loader2 className="h-4 w-4 animate-spin mr-1" />} Submit Review
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-primary">₹{pg.price?.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/month</span></CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {pg.vacancies !== null && <p>{pg.vacancies > 0 ? `${pg.vacancies} vacancies available` : "No vacancies"}</p>}
            </CardContent>
          </Card>

          {/* Booking form */}
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><CalendarDays className="h-5 w-5" /> Book a Visit</CardTitle></CardHeader>
            <CardContent>
              {hasBooked ? (
                <p className="text-success font-medium">✓ You have already booked a visit!</p>
              ) : (
                <form onSubmit={handleBook} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Date</Label>
                    <Input type="date" required value={booking.date} onChange={e => setBooking(b => ({ ...b, date: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Time</Label>
                    <Input type="time" required value={booking.time} onChange={e => setBooking(b => ({ ...b, time: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone (optional)</Label>
                    <Input type="tel" value={booking.phone} onChange={e => setBooking(b => ({ ...b, phone: e.target.value }))} />
                  </div>
                  <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={bookingLoading}>
                    {bookingLoading && <Loader2 className="h-4 w-4 animate-spin mr-1" />} Book Visit
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}