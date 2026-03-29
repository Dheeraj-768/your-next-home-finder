import { useState } from "react";
import { pgListings } from "@/data/mockData";
import PGCard from "@/components/PGCard";
import { Heart } from "lucide-react";

export default function WishlistPage() {
  // Mock: first 2 PGs are wishlisted
  const [wishlistIds] = useState(["2", "3"]);
  const wishlisted = pgListings.filter((pg) => wishlistIds.includes(pg.id));

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8">
      <div className="container">
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">Your Wishlist</h1>
        <p className="text-sm text-muted-foreground mb-6">{wishlisted.length} saved PGs</p>

        {wishlisted.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {wishlisted.map((pg, i) => (
              <PGCard key={pg.id} pg={pg} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-display font-semibold text-foreground mb-1">No saved PGs yet</p>
            <p className="text-sm text-muted-foreground">Tap the heart icon on any PG to save it here</p>
          </div>
        )}
      </div>
    </div>
  );
}
