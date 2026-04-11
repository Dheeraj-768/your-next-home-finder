import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Home, LogOut, User, LayoutDashboard, Search } from "lucide-react";

export default function Navbar() {
  const { user, role, isReady, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Home className="h-6 w-6 text-primary" />
          <span className="font-display text-xl font-bold gradient-text">StayFinder</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link to="/listings">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Search className="h-4 w-4" /> Browse
            </Button>
          </Link>

          {isReady && user ? (
            <>
              {role === "pg_owner" && (
                <Link to="/owner">
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Button>
                </Link>
              )}
              {role === "user" && (
                <Link to="/my-bookings">
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <User className="h-4 w-4" /> My Bookings
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-1.5">
                <LogOut className="h-4 w-4" /> Sign Out
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="gradient-primary text-primary-foreground">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}