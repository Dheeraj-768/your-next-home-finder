import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Home, Shield, Star } from "lucide-react";

export default function Index() {
  const { user, role } = useAuth();

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 lg:py-36">
        <div className="absolute inset-0 gradient-primary opacity-5" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="font-display text-5xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in">
            Find Your Perfect <span className="gradient-text">PG Stay</span>
          </h1>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Browse verified PG and hostel listings with 360° room views, transparent pricing, and instant booking.
          </p>
          <div className="flex flex-wrap gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <Link to="/listings">
              <Button size="lg" className="gradient-primary text-primary-foreground gap-2 text-base px-8">
                <Search className="h-5 w-5" /> Browse PGs
              </Button>
            </Link>
            {!user && (
              <Link to="/auth">
                <Button size="lg" variant="outline" className="gap-2 text-base px-8">
                  Get Started
                </Button>
              </Link>
            )}
            {user && role === "pg_owner" && (
              <Link to="/owner">
                <Button size="lg" variant="outline" className="gap-2 text-base px-8">
                  Owner Dashboard
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-center mb-12">Why StayFinder?</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { icon: Home, title: "Verified Listings", desc: "Every PG is reviewed and verified before listing." },
              { icon: Star, title: "360° Room Views", desc: "Explore rooms interactively before visiting." },
              { icon: Shield, title: "Secure Booking", desc: "Book visits securely with role-based access." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center p-6 rounded-xl border border-border/50 hover:shadow-glow transition-shadow">
                <div className="mx-auto w-14 h-14 rounded-full gradient-primary flex items-center justify-center mb-4">
                  <Icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
