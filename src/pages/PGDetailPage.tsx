import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Heart, MapPin, Star, Users, Calendar, Phone, MessageCircle, Wifi, UtensilsCrossed, Shield, Dumbbell, Car, Zap, Droplets, CheckCircle2 } from "lucide-react";
import { useState, useEffect, Suspense, lazy } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StarRating } from "@/components/RatingComponents";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

const PanoramaViewer = lazy(() => import("@/components/PanoramaViewer"));

const facilityIconMap: Record<string, React.ElementType> = {
  WiFi: Wifi, Food: UtensilsCrossed, Security: Shield, Gym: Dumbbell,
  Parking: Car, "Power Backup": Zap, "Hot Water": Droplets, CCTV: Shield,
  Laundry: Droplets, AC: Zap,
};

type PGWithImages = Tables<"pg_listings"> & { pg_images: Tables<"pg_images">[]; profiles: { full_name: string | null } | null };

export default function PGDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [pg, setPg] = useState<PGWithImages | null>(null);
  const [reviews, setReviews] = useState<(Tables<"reviews"> & { profiles: { full_name: string | null; phone: string | null } | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showPanorama, setShowPanorama] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchPG = async () => {
      const { data } = await supabase
        .from("pg_listings")
        .select("*, pg_images(*), profiles!pg_listings_owner_id_fkey(full_name)")
        .eq("id", id!)
        .single();
      if (data) setPg(data as PGWithImages);

      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("*, profiles(full_name, phone)")
        .eq("pg_id", id!);
      if (reviewsData) setReviews(reviewsData as any);
      setLoading(false);
    };
    if (id) fetchPG();
  }, [id]);

  const handleSubmitReview = async () => {
    if (!user) { toast.error("Please log in to review"); return; }
    
    // Check if user has a booking for this PG
    const { data: booking } = await supabase
      .from("bookings")
      .select("id")
      .eq("user_id", user.id)
      .eq("pg_id", id!)
      .limit(1)
      .single();
    
    if (!booking) {
      toast.error("Only users who booked this PG can review");
      return;
    }
    
    setSubmittingReview(true);
    const { error } = await supabase.from("reviews").insert({
      user_id: user.id,
      pg_id: id!,
      rating: reviewRating,
      comment: reviewComment,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Review submitted!");
      setReviewComment("");
      // Refresh reviews
      const { data } = await supabase.from("reviews").select("*, profiles(full_name, phone)").eq("pg_id", id!);
      if (data) setReviews(data as any);
    }
    setSubmittingReview(false);
  };

  if (loading) {
    return <div className="min-h-screen pt-20 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  if (!pg) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">PG not found</h1>
          <Link to="/listings" className="text-primary hover:underline text-sm">Back to listings</Link>
        </div>
      </div>
    );
  }

  const normalImages = pg.pg_images?.filter((img) => !img.is_360) ?? [];
  const panoramaImages = pg.pg_images?.filter((img) => img.is_360) ?? [];
  const amenities = pg.amenities ?? [];

  return (
    <div className="min-h-screen pt-16 pb-24 md:pb-8">
      <div className="container py-4 flex items-center gap-3">
        <Link to="/listings" className="p-2 rounded-lg hover:bg-secondary transition-colors"><ArrowLeft className="w-5 h-5 text-foreground" /></Link>
        <div className="flex-1">
          <h1 className="font-display text-xl font-bold text-foreground">{pg.title}</h1>
          <div className="flex items-center gap-1 text-muted-foreground text-sm"><MapPin className="w-3.5 h-3.5" />{pg.location}</div>
        </div>
        <button onClick={() => setWishlisted(!wishlisted)} className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <Heart className={`w-5 h-5 ${wishlisted ? "fill-destructive text-destructive" : "text-foreground"}`} />
        </button>
      </div>

      <div className="container mb-6">
        {normalImages.length > 0 && (
          <>
            <div className="rounded-xl overflow-hidden">
              <div className="aspect-video relative">
                <img src={normalImages[selectedImage]?.image_url} alt={pg.title} className="w-full h-full object-cover" />
                {panoramaImages.length > 0 && (
                  <button onClick={() => setShowPanorama(!showPanorama)}
                    className="absolute bottom-3 right-3 px-3 py-2 glass rounded-lg text-sm font-medium text-foreground hover:bg-card transition-colors">
                    {showPanorama ? "📷 Photos" : "🔄 360° View"}
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              {normalImages.map((img, i) => (
                <button key={i} onClick={() => { setSelectedImage(i); setShowPanorama(false); }}
                  className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === i && !showPanorama ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"}`}>
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
              {panoramaImages.length > 0 && (
                <button onClick={() => setShowPanorama(true)}
                  className={`w-16 h-12 rounded-lg border-2 flex items-center justify-center text-xs font-medium transition-all ${showPanorama ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground"}`}>
                  360°
                </button>
              )}
            </div>
          </>
        )}

        {showPanorama && panoramaImages.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
            <Suspense fallback={<div className="w-full aspect-video rounded-xl bg-secondary animate-pulse" />}>
              <PanoramaViewer url={panoramaImages[0].image_url} />
            </Suspense>
          </motion.div>
        )}
      </div>

      <div className="container grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Rent", value: `₹${pg.price.toLocaleString()}/mo` },
              { label: "Vacancies", value: `${pg.vacancies ?? 0} beds` },
              { label: "Type", value: pg.gender ?? "any" },
              { label: "Occupancy", value: pg.occupancy ?? "N/A" },
            ].map((item) => (
              <div key={item.label} className="bg-card rounded-lg border border-border p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                <p className="font-display font-semibold text-foreground text-sm capitalize">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="font-display font-semibold text-foreground mb-3">About</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{pg.description}</p>
            {pg.profiles?.full_name && (
              <p className="text-sm text-muted-foreground mt-2">Owner: {pg.profiles.full_name}</p>
            )}
          </div>

          {amenities.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-5">
              <h2 className="font-display font-semibold text-foreground mb-3">Facilities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {amenities.map((f) => {
                  const Icon = facilityIconMap[f] || CheckCircle2;
                  return (
                    <div key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Icon className="w-4 h-4 text-primary" /></div>
                      {f}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="font-display font-semibold text-foreground mb-4">Reviews ({reviews.length})</h2>
            {reviews.length > 0 ? (
              <div className="space-y-4 mb-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                        {(review.profiles?.full_name?.[0] || "U").toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-foreground">{review.profiles?.full_name || "User"}</span>
                        <p className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</p>
                      </div>
                      <StarRating rating={review.rating} />
                    </div>
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-6">No reviews yet. Be the first to review!</p>
            )}

            {user && (
              <div className="border-t border-border pt-4 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Write a Review</h3>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Rating:</label>
                  <select value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))}
                    className="px-2 py-1 rounded border border-border bg-secondary text-sm">
                    {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} ⭐</option>)}
                  </select>
                </div>
                <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Share your experience..."
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" rows={3} />
                <button onClick={handleSubmitReview} disabled={submittingReview || !reviewComment}
                  className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium shadow-glow hover:opacity-90 disabled:opacity-50">
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-5 sticky top-20">
            <div className="text-center mb-4">
              <p className="font-display text-2xl font-bold gradient-text">₹{pg.price.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">per month</p>
            </div>
            {(pg.vacancies ?? 0) > 0 ? (
              <span className="w-full block text-center px-3 py-1.5 rounded-lg bg-success/10 text-success text-sm font-medium mb-4">
                {pg.vacancies} {pg.vacancies === 1 ? "vacancy" : "vacancies"} available
              </span>
            ) : (
              <span className="w-full block text-center px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-sm font-medium mb-4">No vacancies</span>
            )}

            {!showBooking && !bookingSubmitted && (
              <button onClick={() => setShowBooking(true)} disabled={(pg.vacancies ?? 0) === 0}
                className="w-full py-3 rounded-lg gradient-primary text-primary-foreground font-semibold shadow-glow hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                <Calendar className="w-4 h-4 inline mr-2" /> Book a Visit
              </button>
            )}

            {showBooking && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Phone</label>
                  <input type="tel" value={bookingPhone} onChange={(e) => setBookingPhone(e.target.value)} placeholder="Your phone number"
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <button onClick={handleBooking} disabled={!bookingPhone || bookingSubmitting}
                  className="w-full py-3 rounded-lg gradient-primary text-primary-foreground font-semibold shadow-glow hover:opacity-90 disabled:opacity-50">
                  {bookingSubmitting ? "Booking..." : "Confirm Booking"}
                </button>
              </motion.div>
            )}

            {bookingSubmitted && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto"><CheckCircle2 className="w-6 h-6 text-success" /></div>
                <p className="text-sm font-semibold text-foreground">Booking Confirmed!</p>
                <p className="text-xs text-muted-foreground">You can now leave a review.</p>
              </motion.div>
            )}

            <div className="flex gap-2 mt-4">
              <button className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors flex items-center justify-center gap-1">
                <Phone className="w-4 h-4" /> Call
              </button>
              <button className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors flex items-center justify-center gap-1">
                <MessageCircle className="w-4 h-4" /> Chat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
