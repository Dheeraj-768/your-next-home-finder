import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("resident");
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = () => {
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    login(email, password, role);
    toast.success(`Logged in as ${role}`);
    if (role === "admin") navigate("/admin");
    else if (role === "owner") navigate("/owner");
    else navigate("/listings");
  };

  const quickLogin = (r: UserRole) => {
    const accounts: Record<string, { email: string; pass: string }> = {
      admin: { email: "admin@stayfinder.com", pass: "admin123" },
      owner: { email: "owner@stayfinder.com", pass: "owner123" },
      resident: { email: "resident@stayfinder.com", pass: "res123" },
    };
    const acc = accounts[r!];
    login(acc.email, acc.pass, r);
    toast.success(`Quick login as ${r}`);
    if (r === "admin") navigate("/admin");
    else if (r === "owner") navigate("/owner");
    else navigate("/listings");
  };

  return (
    <div className="min-h-screen pt-16 flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-display font-bold">PG</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Log in to your StayFinder account</p>
        </div>

        {/* Quick Login */}
        <div className="mb-4 bg-card rounded-xl border border-border p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Quick Demo Login</p>
          <div className="flex gap-2">
            {(["admin", "owner", "resident"] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => quickLogin(r)}
                className="flex-1 py-2 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-secondary transition-colors capitalize"
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Role</label>
            <select
              value={role || ""}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="resident">Resident</option>
              <option value="owner">PG Owner</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
              <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button onClick={handleLogin} className="w-full py-3 rounded-lg gradient-primary text-primary-foreground font-semibold shadow-glow hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            Log in <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary font-medium hover:underline">Sign up</Link>
        </p>
      </motion.div>
    </div>
  );
}
