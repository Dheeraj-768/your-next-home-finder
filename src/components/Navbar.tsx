import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Home, LogOut, User, LayoutDashboard, Search, ShieldCheck, Menu } from "lucide-react";

export default function Navbar() {
  const { user, role, isReady, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
    navigate("/");
  };

  const NavItems = ({ mobile = false }: { mobile?: boolean }) => {
    const close = () => mobile && setOpen(false);
    return (
      <>
        <Link to="/listings" onClick={close}>
          <Button variant="ghost" size="sm" className="gap-1.5 w-full justify-start">
            <Search className="h-4 w-4" /> Browse
          </Button>
        </Link>
        {isReady && user ? (
          <>
            {role === "admin" && (
              <Link to="/admin" onClick={close}>
                <Button variant="ghost" size="sm" className="gap-1.5 w-full justify-start">
                  <ShieldCheck className="h-4 w-4" /> Admin
                </Button>
              </Link>
            )}
            {role === "pg_owner" && (
              <Link to="/owner" onClick={close}>
                <Button variant="ghost" size="sm" className="gap-1.5 w-full justify-start">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Button>
              </Link>
            )}
            {role === "user" && (
              <Link to="/my-bookings" onClick={close}>
                <Button variant="ghost" size="sm" className="gap-1.5 w-full justify-start">
                  <User className="h-4 w-4" /> My Bookings
                </Button>
              </Link>
            )}
            <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-1.5 w-full justify-start">
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </>
        ) : (
          <Link to="/auth" onClick={close}>
            <Button size="sm" className="gradient-primary text-primary-foreground w-full">
              Sign In
            </Button>
          </Link>
        )}
      </>
    );
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Home className="h-6 w-6 text-primary" />
          <span className="font-display text-xl font-bold gradient-text">StayFinder</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-3">
          <NavItems />
        </div>

        {/* Mobile */}
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 pt-12 flex flex-col gap-2">
              <NavItems mobile />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
