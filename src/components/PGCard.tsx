import { Link } from "react-router-dom";
import { Heart, MapPin, Star, Users, Wifi, UtensilsCrossed, Shield } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import type { PGListing } from "@/data/mockData";

const facilityIcons: Record<string, React.ElementType> = {
  WiFi: Wifi,
  Food: UtensilsCrossed,
  Security: Shield,
};

export default function PGCard({ pg, index = 0 }: { pg: PGListing; index?: number }) {
  const [wishlisted, setWishlisted] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <Link to={`/pg/${pg.id}`} className="group block">
        <div className="bg-card rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1">
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden">
            <img
              src={pg.images[0]}
              alt={pg.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />

            {/* Wishlist */}
            <button
              onClick={(e) => {
                e.preventDefault();
                setWishlisted(!wishlisted);
              }}
              className="absolute top-3 right-3 p-2 rounded-full glass"
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  wishlisted ? "fill-destructive text-destructive" : "text-foreground"
                }`}
              />
            </button>

            {/* Vacancy badge */}
            {pg.vacancies > 0 ? (
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-success text-success-foreground text-xs font-semibold">
                {pg.vacancies} {pg.vacancies === 1 ? "bed" : "beds"} left
              </span>
            ) : (
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-semibold">
                Full
              </span>
            )}

            {/* Gender */}
            <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full glass text-xs font-semibold capitalize text-foreground">
              {pg.gender}
            </span>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-display font-semibold text-foreground text-base line-clamp-1 group-hover:text-primary transition-colors">
                {pg.name}
              </h3>
              <div className="flex items-center gap-1 shrink-0">
                <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                <span className="text-sm font-semibold text-foreground">{pg.rating}</span>
                <span className="text-xs text-muted-foreground">({pg.reviewCount})</span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-muted-foreground mb-3">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-xs">{pg.location}</span>
            </div>

            {/* Facilities */}
            <div className="flex items-center gap-2 mb-3">
              {pg.facilities.slice(0, 4).map((f) => {
                const Icon = facilityIcons[f];
                return (
                  <span key={f} className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                    {Icon && <Icon className="w-3 h-3" />}
                    {f}
                  </span>
                );
              })}
              {pg.facilities.length > 4 && (
                <span className="text-xs text-muted-foreground">+{pg.facilities.length - 4}</span>
              )}
            </div>

            {/* Price & occupancy */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div>
                <span className="text-lg font-display font-bold gradient-text">₹{pg.rent.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">/month</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                {pg.occupancy}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
