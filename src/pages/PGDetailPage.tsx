import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Heart, MapPin, Star, Users, Calendar, Phone, MessageCircle, Wifi, UtensilsCrossed, Shield, Dumbbell, Car, Zap, Droplets, Gamepad2, Fingerprint, PartyPopper, MonitorSmartphone, Building2, CheckCircle2, Clock } from "lucide-react";
import { useState, Suspense, lazy } from "react";
import { motion } from "framer-motion";
import { pgListings, reviews as allReviews } from "@/data/mockData";
import { StarRating, RatingBar } from "@/components/RatingComponents";

const PanoramaViewer = lazy(() => import("@/components/PanoramaViewer"));

const facilityIconMap: Record<string, React.ElementType> = {
  WiFi: Wifi, Food: UtensilsCrossed, Security: Shield, Gym: Dumbbell,
  Parking: Car, "Power Backup": Zap, "Hot Water": Droplets, "Gaming Zone": Gamepad2,
  "Biometric Entry": Fingerprint, Events: PartyPopper, Coworking: MonitorSmartphone,
  CCTV: Shield, Laundry: Droplets, Housekeeping: Building2, AC: Zap, Terrace: Building2,
  "Security Guard": Shield,
};

export default function PGDetailPage() {
  const { id } = useParams();
  const pg = pgListings.find((p) => p.id === id);
  const pgReviews = allReviews.filter((r) => r.pgId === id);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showPanorama, setShowPanorama] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingSubmitted, setBookingSubmitted] = useState(false);

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

  return (
    <div className="min-h-screen pt-16 pb-24 md:pb-8">
      {/* Header */}
      <div className="container py-4 flex items-center gap-3">
        <Link to="/listings" className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-xl font-bold text-foreground">{pg.name}</h1>
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <MapPin className="w-3.5 h-3.5" />
            {pg.location}
          </div>
        </div>
        <button onClick={() => setWishlisted(!wishlisted)} className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <Heart className={`w-5 h-5 ${wishlisted ? "fill-destructive text-destructive" : "text-foreground"}`} />
        </button>
      </div>

      {/* Images */}
      <div className="container mb-6">
        <div className="rounded-xl overflow-hidden">
          <div className="aspect-video relative">
            <img src={pg.images[selectedImage]} alt={pg.name} className="w-full h-full object-cover" />
            {pg.panoramaUrl && (
              <button
                onClick={() => setShowPanorama(!showPanorama)}
                className="absolute bottom-3 right-3 px-3 py-2 glass rounded-lg text-sm font-medium text-foreground hover:bg-card transition-colors"
              >
                {showPanorama ? "📷 Photos" : "🔄 360° View"}
              </button>
            )}
          </div>
        </div>

        {/* Thumbnails */}
        <div className="flex gap-2 mt-2">
          {pg.images.map((img, i) => (
            <button
              key={i}
              onClick={() => { setSelectedImage(i); setShowPanorama(false); }}
              className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                selectedImage === i && !showPanorama ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
          {pg.panoramaUrl && (
            <button
              onClick={() => setShowPanorama(true)}
              className={`w-16 h-12 rounded-lg border-2 flex items-center justify-center text-xs font-medium transition-all ${
                showPanorama ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground"
              }`}
            >
              360°
            </button>
          )}
        </div>

        {/* Panorama */}
        {showPanorama && pg.panoramaUrl && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 relative">
            <Suspense fallback={<div className="w-full aspect-video rounded-xl bg-secondary animate-pulse" />}>
              <PanoramaViewer url={pg.panoramaUrl} />
            </Suspense>
          </motion.div>
        )}
      </div>

      <div className="container grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Rent", value: `₹${pg.rent.toLocaleString()}/mo`, icon: "💰" },
              { label: "Rating", value: `${pg.rating} ⭐`, icon: "" },
              { label: "Vacancies", value: `${pg.vacancies} beds`, icon: "🛏️" },
              { label: "Type", value: pg.gender, icon: "👤" },
            ].map((item) => (
              <div key={item.label} className="bg-card rounded-lg border border-border p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                <p className="font-display font-semibold text-foreground text-sm capitalize">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="font-display font-semibold text-foreground mb-3">About</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{pg.description}</p>
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>Occupancy: {pg.occupancy}</span>
            </div>
          </div>

          {/* Facilities */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="font-display font-semibold text-foreground mb-3">Facilities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {pg.facilities.map((f) => {
                const Icon = facilityIconMap[f] || CheckCircle2;
                return (
                  <div key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    {f}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nearby */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="font-display font-semibold text-foreground mb-3">Nearby Places</h2>
            <div className="space-y-3">
              {pg.nearbyPlaces.map((place) => (
                <div key={place.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground">{place.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">{place.distance}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ratings */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="font-display font-semibold text-foreground mb-4">Ratings</h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-center">
                <p className="font-display text-3xl font-bold gradient-text">{pg.rating}</p>
                <StarRating rating={pg.rating} />
                <p className="text-xs text-muted-foreground mt-1">{pg.reviewCount} reviews</p>
              </div>
              <div className="flex-1 space-y-2">
                <RatingBar label="Food" value={pg.ratings.food} />
                <RatingBar label="Cleanliness" value={pg.ratings.cleanliness} />
                <RatingBar label="WiFi" value={pg.ratings.wifi} />
                <RatingBar label="Safety" value={pg.ratings.safety} />
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="font-display font-semibold text-foreground mb-4">Reviews</h2>
            {pgReviews.length > 0 ? (
              <div className="space-y-4">
                {pgReviews.map((review) => (
                  <div key={review.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                        {review.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{review.studentName}</span>
                          {review.verified && (
                            <span className="flex items-center gap-0.5 text-xs text-success">
                              <CheckCircle2 className="w-3 h-3" /> Verified
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{review.date}</p>
                      </div>
                      <StarRating rating={review.rating} />
                    </div>
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No reviews yet</p>
            )}
          </div>
        </div>

        {/* Sidebar: Booking */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-5 sticky top-20">
            <div className="text-center mb-4">
              <p className="font-display text-2xl font-bold gradient-text">₹{pg.rent.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">per month</p>
            </div>

            {pg.vacancies > 0 ? (
              <span className="w-full block text-center px-3 py-1.5 rounded-lg bg-success/10 text-success text-sm font-medium mb-4">
                {pg.vacancies} {pg.vacancies === 1 ? "vacancy" : "vacancies"} available
              </span>
            ) : (
              <span className="w-full block text-center px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-sm font-medium mb-4">
                No vacancies
              </span>
            )}

            {!showBooking && !bookingSubmitted && (
              <button
                onClick={() => setShowBooking(true)}
                disabled={pg.vacancies === 0}
                className="w-full py-3 rounded-lg gradient-primary text-primary-foreground font-semibold shadow-glow hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Book a Visit
              </button>
            )}

            {showBooking && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Date</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Time</label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Select time</option>
                    {["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => {
                    if (bookingDate && bookingTime) setBookingSubmitted(true);
                  }}
                  disabled={!bookingDate || !bookingTime}
                  className="w-full py-3 rounded-lg gradient-primary text-primary-foreground font-semibold shadow-glow hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Confirm Visit
                </button>
              </motion.div>
            )}

            {bookingSubmitted && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6 text-success" />
                </div>
                <p className="text-sm font-semibold text-foreground">Visit Booked!</p>
                <p className="text-xs text-muted-foreground">{bookingDate} at {bookingTime}</p>
                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">Owner Contact</p>
                  <p className="text-sm font-medium text-foreground">{pg.ownerName}</p>
                  <p className="text-sm text-primary">+91 98765 43210</p>
                </div>
              </motion.div>
            )}

            {/* Contact buttons */}
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
