import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck, Building2, Users, IndianRupee, CheckCircle2, Clock, X, Eye, Flag, Trash2, Filter,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import {
  getAllListings, approveListing, rejectListing, flagListing, removeListing,
  type ManagedListing, type ListingStatus,
} from "@/data/listingsStore";
import { mockResidents, mockRentRecords } from "@/data/rentData";

const listingStatusConfig: Record<ListingStatus, { label: string; className: string }> = {
  approved: { label: "Approved", className: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  pending: { label: "Pending", className: "bg-amber-500/10 text-amber-600 border-amber-200" },
  rejected: { label: "Rejected", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [listings, setListings] = useState<ManagedListing[]>(getAllListings());
  const [statusFilter, setStatusFilter] = useState<"all" | ListingStatus>("all");
  const [selectedListing, setSelectedListing] = useState<ManagedListing | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const refresh = () => setListings(getAllListings());

  const filteredListings = useMemo(() =>
    statusFilter === "all" ? listings : listings.filter((l) => l.status === statusFilter),
    [listings, statusFilter]
  );

  const stats = useMemo(() => ({
    totalListings: listings.length,
    approved: listings.filter((l) => l.status === "approved").length,
    pending: listings.filter((l) => l.status === "pending").length,
    totalUsers: mockResidents.length + 3, // residents + demo users
    totalPayments: mockRentRecords.filter((r) => r.status === "paid").length,
    pendingPayments: mockRentRecords.filter((r) => r.status !== "paid").length,
  }), [listings]);

  const handleApprove = (id: string) => {
    approveListing(id);
    refresh();
    setSelectedListing(null);
  };

  const handleReject = (id: string) => {
    if (!rejectReason.trim()) return;
    rejectListing(id, rejectReason);
    refresh();
    setRejectReason("");
    setShowRejectInput(false);
    setSelectedListing(null);
  };

  const handleFlag = (id: string) => {
    flagListing(id);
    refresh();
  };

  const handleRemove = (id: string) => {
    removeListing(id);
    refresh();
    setSelectedListing(null);
  };

  const statCards = [
    { label: "Total Listings", value: stats.totalListings, icon: Building2, accent: "text-primary" },
    { label: "Pending Approval", value: stats.pending, icon: Clock, accent: "text-amber-600" },
    { label: "Total Users", value: stats.totalUsers, icon: Users, accent: "text-accent" },
    { label: "Payments Received", value: stats.totalPayments, icon: IndianRupee, accent: "text-emerald-600" },
  ];

  const statusFilters: { label: string; value: "all" | ListingStatus }[] = [
    { label: "All", value: "all" },
    { label: "Approved", value: "approved" },
    { label: "Pending", value: "pending" },
    { label: "Rejected", value: "rejected" },
  ];

  return (
    <div className="min-h-screen pt-16 pb-20 md:pb-8">
      <div className="container py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Platform management & oversight</p>
          </div>
        </div>

        {/* Stats */}
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

        {/* Tabs */}
        <Tabs defaultValue="listings" className="space-y-4">
          <TabsList className="bg-secondary">
            <TabsTrigger value="listings">PG Listings</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          {/* LISTINGS TAB */}
          <TabsContent value="listings">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <Filter className="w-4 h-4" /> PG Listings
                  </CardTitle>
                  <div className="flex flex-wrap gap-2 sm:ml-auto">
                    {statusFilters.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => setStatusFilter(f.value)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                          statusFilter === f.value
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
                        <TableHead>PG Name</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Rent</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredListings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No listings found</TableCell>
                        </TableRow>
                      ) : (
                        filteredListings.map((l) => (
                          <TableRow key={l.id}>
                            <TableCell className="font-medium text-foreground">{l.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{l.ownerName}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{l.location}</TableCell>
                            <TableCell className="font-semibold">₹{l.rent.toLocaleString("en-IN")}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={listingStatusConfig[l.status].className}>
                                {listingStatusConfig[l.status].label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button variant="ghost" size="sm" onClick={() => { setSelectedListing(l); setShowRejectInput(false); setRejectReason(""); }}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              {l.status === "approved" && (
                                <Button variant="ghost" size="sm" onClick={() => handleFlag(l.id)} className="text-amber-600 hover:text-amber-700">
                                  <Flag className="w-4 h-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => handleRemove(l.id)} className="text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* USERS TAB */}
          <TabsContent value="users">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="font-display text-lg">All Users</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Super Admin</TableCell>
                        <TableCell className="text-muted-foreground text-sm">admin@stayfinder.com</TableCell>
                        <TableCell><Badge className="bg-primary/10 text-primary border-primary/20" variant="outline">Admin</Badge></TableCell>
                        <TableCell>—</TableCell>
                        <TableCell className="text-sm text-muted-foreground">Jan 2025</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Rajesh Kumar</TableCell>
                        <TableCell className="text-muted-foreground text-sm">owner@stayfinder.com</TableCell>
                        <TableCell><Badge className="bg-amber-500/10 text-amber-600 border-amber-200" variant="outline">Owner</Badge></TableCell>
                        <TableCell>—</TableCell>
                        <TableCell className="text-sm text-muted-foreground">Mar 2025</TableCell>
                      </TableRow>
                      {mockResidents.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.name}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{r.email}</TableCell>
                          <TableCell><Badge className="bg-accent/10 text-accent border-accent/20" variant="outline">Resident</Badge></TableCell>
                          <TableCell>{r.roomNumber}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{new Date(r.joinDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PAYMENTS TAB */}
          <TabsContent value="payments">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="font-display text-lg">All Payments</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Resident</TableHead>
                        <TableHead>Month</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockRentRecords.map((rec) => {
                        const resident = mockResidents.find((r) => r.id === rec.residentId);
                        const statusMap: Record<string, { label: string; cls: string }> = {
                          paid: { label: "Paid", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
                          pending: { label: "Pending", cls: "bg-destructive/10 text-destructive border-destructive/20" },
                          pending_verification: { label: "Verifying", cls: "bg-amber-500/10 text-amber-600 border-amber-200" },
                          rejected: { label: "Rejected", cls: "bg-destructive/10 text-destructive border-destructive/20" },
                        };
                        const s = statusMap[rec.status] || statusMap.pending;
                        return (
                          <TableRow key={rec.id}>
                            <TableCell className="font-medium">{resident?.name || "Unknown"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{rec.month}</TableCell>
                            <TableCell className="font-semibold">₹{rec.amount.toLocaleString("en-IN")}</TableCell>
                            <TableCell><Badge variant="outline" className={s.cls}>{s.label}</Badge></TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {rec.paymentDate ? new Date(rec.paymentDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Listing Detail Dialog */}
      <Dialog open={!!selectedListing} onOpenChange={(o) => { if (!o) setSelectedListing(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{selectedListing?.name}</DialogTitle>
            <DialogDescription>
              {selectedListing?.ownerName} — {selectedListing?.location} — ₹{selectedListing?.rent.toLocaleString("en-IN")}/mo
            </DialogDescription>
          </DialogHeader>

          {selectedListing?.images[0] && (
            <div className="rounded-lg overflow-hidden border border-border">
              <img src={selectedListing.images[0]} alt={selectedListing.name} className="w-full h-48 object-cover" />
            </div>
          )}

          <div className="text-sm space-y-2">
            <p className="text-muted-foreground">{selectedListing?.description}</p>
            <div className="flex flex-wrap gap-1">
              {selectedListing?.facilities.map((f) => (
                <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
              ))}
            </div>
            <p>
              <span className="text-muted-foreground">Status: </span>
              <Badge variant="outline" className={listingStatusConfig[selectedListing?.status || "pending"].className}>
                {listingStatusConfig[selectedListing?.status || "pending"].label}
              </Badge>
            </p>
            {selectedListing?.rejectionReason && (
              <p className="text-destructive text-xs">Reason: {selectedListing.rejectionReason}</p>
            )}
          </div>

          {showRejectInput && (
            <Textarea
              placeholder="Reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="resize-none"
            />
          )}

          {selectedListing?.status === "pending" && (
            <DialogFooter className="gap-2">
              {!showRejectInput ? (
                <>
                  <Button variant="outline" onClick={() => setShowRejectInput(true)}>
                    <X className="w-4 h-4 mr-1" /> Reject
                  </Button>
                  <Button onClick={() => handleApprove(selectedListing.id)} className="gradient-primary text-primary-foreground">
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => setShowRejectInput(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={() => handleReject(selectedListing.id)} disabled={!rejectReason.trim()}>
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
