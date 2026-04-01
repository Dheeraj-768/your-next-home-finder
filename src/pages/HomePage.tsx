import { Link } from "react-router-dom";
import { Search, ArrowRight, Shield, Star, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import PGCard from "@/components/PGCard";
import type { Tables } from "@/integrations/supabase/types";

type PGWithImages = Tables<"pg_listings"> & { pg_images: Tables<"pg_images">[] };

const features = [
  { icon: Search, title: "Smart Search", desc: "Filter by budget, location, and facilities" },
  { icon: Shield, title: "Verified PGs", desc: "Every listing is verified for safety" },
  { icon: Star, title: "Honest Reviews", desc: "Only verified residents can review" },
  { icon: Zap, title: "Instant Booking", desc: "Book visits in just a few taps" },
];

export default function HomePage() {
  const [topListings, setTopListings] = useState<PGWithImages[]>([]);

  useEffect(() => {
    supabase
      .from("pg_listings")
      .select("*, pg_images(*)")
      .eq("verified", true)
      .limit(3)
      .then(({ data }) => {
        if (data) setTopListings(data as PGWithImages[]);
      });
  }, []);

  return (
    <div className="min-h-screen pt-16 pb-20 md:pb-0">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-5" />
        <div className="container py-16 md:py-24">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-2xl mx-auto text-center">
            <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-4 leading-tight">
              Find Your Perfect <span className="gradient-text">PG Stay</span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl mb-8">
              Browse verified hostels and PGs with 360° room views, honest reviews, and instant visit booking.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/listings" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg gradient-primary text-primary-foreground font-semibold shadow-glow hover:opacity-90 transition-opacity">
                <Search className="w-4 h-4" /> Explore PGs
              </Link>
              <Link to="/signup" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-card border border-border text-foreground font-semibold hover:bg-secondary transition-colors">
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="container py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
              className="bg-card rounded-xl border border-border p-5 text-center hover:shadow-lg hover:shadow-primary/5 transition-all">
              <div className="w-10 h-10 rounded-lg gradient-primary mx-auto mb-3 flex items-center justify-center">
                <f.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="font-display font-semibold text-foreground text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {topListings.length > 0 && (
        <section className="container py-8 pb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">Featured PGs</h2>
              <p className="text-sm text-muted-foreground">Recently verified listings</p>
            </div>
            <Link to="/listings" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {topListings.map((pg, i) => (
              <PGCard key={pg.id} pg={pg} index={i} />
            ))}
          </div>
        </section>
      )}

      <section className="container pb-16">
        <div className="gradient-primary rounded-2xl p-8 md:p-12 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-primary-foreground mb-3">Are you a PG Owner?</h2>
          <p className="text-primary-foreground/80 mb-6 max-w-md mx-auto">List your property, manage bookings, and reach thousands of students.</p>
          <Link to="/signup" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary-foreground text-primary font-semibold hover:opacity-90 transition-opacity">
            List Your PG <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
