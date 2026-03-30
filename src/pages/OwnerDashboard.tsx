import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users, IndianRupee, CheckCircle2, Clock, AlertTriangle, Eye, Check, X, Filter, Plus, Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import NotificationBell from "@/components/NotificationBell";
import {
  mockResidents, mockRentRecords, mockNotifications,
  type Resident, type RentRecord, type Notification,
} from "@/data/rentData";
import { useAuth } from "@/contexts/AuthContext";
import { getOwnerListings, type ManagedListing } from "@/data/listingsStore";
import { Badge } from "@/components/ui/badge";

type StatusFilter = "all" | "paid" | "pending" | "pending_verification" | "rejected";

const statusConfig = {
  paid: { label: "Paid", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200", icon: CheckCircle2 },
  pending: { label: "Pending", color: "bg-destructive/10 text-destructive border-destructive/20", icon: Clock },
  pending_verification: { label: "Verifying", color: "bg-amber-500/10 text-amber-600 border-amber-200", icon: AlertTriangle },
  rejected: { label: "Rejected", color: "bg-destructive/10 text-destructive border-destructive/20", icon: X },
};

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [residents] = useState<Resident[]>(mockResidents);
  const ownerListings = useMemo(() => getOwnerListings(user?.id || ""), [user]);
  const [rentRecords, setRentRecords] = useState<RentRecord[]>(mockRentRecords);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [selectedRecord, setSelectedRecord] = useState<(RentRecord & { resident: Resident }) | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const currentMonth = "2026-03";

  const enrichedRecords = useMemo(() => {
    return rentRecords
      .filter((r) => r.month === currentMonth)
      .map((r) => {
        const resident = residents.find((res) => res.id === r.residentId)!;
        return { ...r, resident };
      })
      .filter((r) => filter === "all" || r.status === filter);
  }, [rentRecords, residents, filter, currentMonth]);

  const stats = useMemo(() => {
    const monthRecords = rentRecords.filter((r) => r.month === currentMonth);
    const paid = monthRecords.filter((r) => r.status === "paid");
    const pending = monthRecords.filter((r) => r.status === "pending" || r.status === "rejected");
    const verifying = monthRecords.filter((r) => r.status === "pending_verification");
    const totalCollected = paid.reduce((s, r) => s + r.amount, 0);
    const totalExpected = monthRecords.reduce((s, r) => s + r.amount, 0);
    return { total: residents.length, paid: paid.length, pending: pending.length, verifying: verifying.length, totalCollected, totalExpected };
  }, [rentRecords, residents, currentMonth]);

  const handleApprove = (recordId: string) => {
    setRentRecords((prev) =>
      prev.map((r) => r.id === recordId ? { ...r, status: "paid" as const, verifiedAt: new Date().toISOString() } : r)
    );
    setSelectedRecord(null);
  };

  const handleReject = (recordId: string) => {
    if (!rejectReason.trim()) return;
    setRentRecords((prev) =>
      prev.map((r) => r.id === recordId ? { ...r, status: "rejected" as const, rejectionReason: rejectReason } : r)
    );
    setRejectReason("");
    setShowRejectInput(false);
    setSelectedRecord(null);
  };

  const markNotifRead = (id: string) => setNotifications((p) => p.map((n) => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => setNotifications((p) => p.map((n) => ({ ...n, read: true })));

  const statCards = [
    { label: "Total Residents", value: stats.total, icon: Users, accent: "text-primary" },
    { label: "Payments Received", value: stats.paid, icon: CheckCircle2, accent: "text-emerald-600" },
    { label: "Pending Payments", value: stats.pending, icon: Clock, accent: "text-destructive" },
    { label: "Awaiting Verification", value: stats.verifying, icon: AlertTriangle, accent: "text-amber-600" },
  ];

  const filters: { label: string; value: StatusFilter }[] = [
    { label: "All", value: "all" },
    { label: "Paid", value: "paid" },
    { label: "Pending", value: "pending" },
    { label: "Verifying", value: "pending_verification" },
    { label: "Rejected", value: "rejected" },
  ];

  return (
    <div className="min-h-screen pt-16 pb-20 md:pb-8">
      <div className="container py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Owner Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Rent management for March 2026
            </p>
          </div>
          <NotificationBell notifications={notifications} onMarkRead={markNotifRead} onMarkAllRead={markAllRead} />
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card className="border-border hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-secondary flex items-center justify-center ${s.accent}`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-display text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Revenue Card */}
        <Card className="mb-6 border-border">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Collected this month</p>
                <p className="text-xl font-bold font-display text-foreground">₹{stats.totalCollected.toLocaleString("en-IN")}</p>
              </div>
            </div>
            <div className="h-px sm:h-8 sm:w-px bg-border" />
            <div>
              <p className="text-xs text-muted-foreground">Expected total</p>
              <p className="text-lg font-semibold text-foreground">₹{stats.totalExpected.toLocaleString("en-IN")}</p>
            </div>
            <div className="h-px sm:h-8 sm:w-px bg-border" />
            <div>
              <p className="text-xs text-muted-foreground">Collection rate</p>
              <p className="text-lg font-semibold text-foreground">
                {stats.totalExpected ? Math.round((stats.totalCollected / stats.totalExpected) * 100) : 0}%
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Filter className="w-4 h-4" /> Residents
              </CardTitle>
              <div className="flex flex-wrap gap-2 sm:ml-auto">
                {filters.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      filter === f.value
                        ? "gradient-primary text-primary-foreground border-transparent"
                        : "bg-card text-muted-foreground border-border hover:bg-secondary"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resident</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Rent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrichedRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No records found for this filter
                      </TableCell>
                    </TableRow>
                  ) : (
                    enrichedRecords.map((rec) => {
                      const cfg = statusConfig[rec.status];
                      return (
                        <TableRow key={rec.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground text-sm">{rec.resident.name}</p>
                              <p className="text-xs text-muted-foreground">{rec.resident.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{rec.resident.roomNumber}</TableCell>
                          <TableCell className="font-semibold">₹{rec.amount.toLocaleString("en-IN")}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`${cfg.color} gap-1`}>
                              <cfg.icon className="w-3 h-3" />
                              {cfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {rec.paymentDate
                              ? new Date(rec.paymentDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {(rec.status === "pending_verification" || rec.paymentProofUrl) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setSelectedRecord(rec); setShowRejectInput(false); setRejectReason(""); }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Proof Dialog */}
      <Dialog open={!!selectedRecord} onOpenChange={(o) => { if (!o) setSelectedRecord(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Payment Proof</DialogTitle>
            <DialogDescription>
              {selectedRecord?.resident.name} — Room {selectedRecord?.resident.roomNumber} — ₹{selectedRecord?.amount.toLocaleString("en-IN")}
            </DialogDescription>
          </DialogHeader>

          {selectedRecord?.paymentProofUrl && (
            <div className="rounded-lg overflow-hidden border border-border">
              <img
                src={selectedRecord.paymentProofUrl}
                alt="Payment proof"
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          <div className="text-sm space-y-1">
            <p><span className="text-muted-foreground">Status:</span>{" "}
              <Badge variant="outline" className={statusConfig[selectedRecord?.status || "pending"].color}>
                {statusConfig[selectedRecord?.status || "pending"].label}
              </Badge>
            </p>
            {selectedRecord?.paymentDate && (
              <p><span className="text-muted-foreground">Uploaded:</span> {new Date(selectedRecord.paymentDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
            )}
            {selectedRecord?.rejectionReason && (
              <p className="text-destructive"><span className="text-muted-foreground">Rejection reason:</span> {selectedRecord.rejectionReason}</p>
            )}
          </div>

          {showRejectInput && (
            <div className="space-y-2">
              <Textarea
                placeholder="Reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="resize-none"
              />
            </div>
          )}

          {selectedRecord?.status === "pending_verification" && (
            <DialogFooter className="gap-2">
              {!showRejectInput ? (
                <>
                  <Button variant="outline" onClick={() => setShowRejectInput(true)}>
                    <X className="w-4 h-4 mr-1" /> Reject
                  </Button>
                  <Button onClick={() => handleApprove(selectedRecord.id)} className="gradient-primary text-primary-foreground">
                    <Check className="w-4 h-4 mr-1" /> Approve
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => setShowRejectInput(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={() => handleReject(selectedRecord.id)} disabled={!rejectReason.trim()}>
                    Confirm Reject
                  </Button>
                </>
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
