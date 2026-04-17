import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Bed, Loader2, Timer, Upload, FileCheck, DoorOpen } from "lucide-react";

interface Props {
  pgId: string;
  pgPrice: number;
  pgTitle: string;
}

interface BedRow {
  id: string;
  room_id: string;
  bed_number: number;
  status: "available" | "reserved" | "booked";
}
interface RoomRow { id: string; room_number: string; total_beds: number; }

export default function BedBookingSection({ pgId, pgPrice, pgTitle }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [beds, setBeds] = useState<BedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [reservation, setReservation] = useState<any>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [reserving, setReserving] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [payForm, setPayForm] = useState({ amount: pgPrice?.toString() || "" });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [paying, setPaying] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load rooms + beds
  const load = async () => {
    setLoading(true);
    const { data: rs } = await supabase.from("rooms").select("*").eq("pg_id", pgId).order("room_number");
    setRooms(rs || []);
    if (rs && rs.length) {
      const { data: bs } = await supabase.from("beds").select("*").in("room_id", rs.map(r => r.id)).order("bed_number");
      setBeds((bs as BedRow[]) || []);
    } else {
      setBeds([]);
    }
    // Resume active reservation
    if (user) {
      const { data: existing } = await supabase
        .from("bed_reservations")
        .select("*, beds(room_id, bed_number)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .gte("expires_at", new Date().toISOString())
        .maybeSingle();
      if (existing) setReservation(existing);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [pgId, user?.id]);

  // Realtime subscription for beds in this PG
  useEffect(() => {
    if (rooms.length === 0) return;
    const roomIds = rooms.map(r => r.id);
    const channel = supabase
      .channel(`beds-${pgId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "beds" }, (payload) => {
        const newBed = payload.new as BedRow | undefined;
        const oldBed = payload.old as BedRow | undefined;
        const bed = newBed || oldBed;
        if (!bed || !roomIds.includes(bed.room_id)) return;
        setBeds(prev => {
          if (payload.eventType === "DELETE") return prev.filter(b => b.id !== oldBed!.id);
          const idx = prev.findIndex(b => b.id === bed.id);
          if (idx === -1) return [...prev, newBed!];
          const next = [...prev]; next[idx] = newBed!;
          return next;
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [pgId, rooms.length]);

  // Countdown timer
  useEffect(() => {
    if (!reservation) { setSecondsLeft(0); return; }
    const tick = () => {
      const remaining = Math.max(0, Math.floor((new Date(reservation.expires_at).getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) {
        toast.error("Reservation expired");
        setReservation(null);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [reservation]);

  const reservedBedId = reservation?.bed_id ?? reservation?.beds?.id;

  const handleSelect = async (bedId: string, status: string) => {
    if (!user) { navigate("/auth"); return; }
    if (status !== "available") return;
    setReserving(bedId);
    const { data, error } = await supabase.rpc("reserve_bed", { _bed_id: bedId });
    setReserving(null);
    if (error) {
      toast.error(error.message.includes("not available") ? "This bed was just taken!" : error.message);
      load();
    } else {
      toast.success("Bed locked for 3 minutes — complete payment to confirm");
      setReservation(data);
    }
  };

  const handleRelease = async () => {
    if (!reservation) return;
    await supabase.rpc("release_reservation", { _reservation_id: reservation.id });
    setReservation(null);
    toast.info("Bed released");
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservation || !user) return;
    if (new Date(reservation.expires_at).getTime() < Date.now()) {
      toast.error("Reservation expired"); setReservation(null); return;
    }
    setPaying(true);

    let proofUrl: string | null = null;
    if (proofFile) {
      const ext = proofFile.name.split(".").pop();
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("payment-proofs").upload(path, proofFile);
      if (upErr) { toast.error("Proof upload failed: " + upErr.message); setPaying(false); return; }
      proofUrl = supabase.storage.from("payment-proofs").getPublicUrl(path).data.publicUrl;
    }

    const bed = beds.find(b => b.id === reservedBedId);
    const room = rooms.find(r => r.id === bed?.room_id);
    const roomLabel = room ? `${room.room_number}-B${bed?.bed_number}` : "";

    const { data: payRow, error: payErr } = await supabase.from("payments").insert({
      user_id: user.id,
      pg_id: pgId,
      room_number: roomLabel,
      amount: parseFloat(payForm.amount),
      status: "pending",
      payment_date: new Date().toISOString(),
      proof_url: proofUrl,
    }).select().single();

    if (payErr || !payRow) { toast.error("Payment failed: " + (payErr?.message || "")); setPaying(false); return; }

    const { error: confirmErr } = await supabase.rpc("confirm_bed_booking", {
      _reservation_id: reservation.id,
      _payment_id: payRow.id,
    });

    setPaying(false);
    if (confirmErr) { toast.error(confirmErr.message); return; }
    toast.success("Bed booked! Awaiting payment verification.");
    setPayOpen(false);
    setReservation(null);
    setProofFile(null);
    load();
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const bedsByRoom = useMemo(() => {
    const map: Record<string, BedRow[]> = {};
    beds.forEach(b => { (map[b.room_id] = map[b.room_id] || []).push(b); });
    return map;
  }, [beds]);

  const availableCount = beds.filter(b => b.status === "available").length;

  if (loading) return <div className="text-center py-6 text-muted-foreground">Loading bed map...</div>;
  if (rooms.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between flex-wrap gap-2">
          <span className="flex items-center gap-2"><Bed className="h-5 w-5" /> Select a Bed</span>
          <span className="text-sm font-normal text-muted-foreground">
            {availableCount > 0 ? `${availableCount} bed${availableCount > 1 ? "s" : ""} available` : "Fully booked"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-success/30 border border-success" />Available</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-warning/30 border border-warning" />Reserved</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-primary border border-primary" />Your pick</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-destructive/30 border border-destructive" />Booked</span>
        </div>

        {rooms.map(r => (
          <div key={r.id} className="border rounded-lg p-3">
            <p className="text-sm font-semibold mb-2 flex items-center gap-1.5"><DoorOpen className="h-4 w-4" /> Room {r.room_number}</p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {(bedsByRoom[r.id] || []).map(b => {
                const isMine = b.id === reservedBedId;
                let cls = "bg-success/15 hover:bg-success/30 border-success text-success-foreground";
                if (b.status === "booked") cls = "bg-destructive/20 border-destructive text-muted-foreground cursor-not-allowed";
                else if (b.status === "reserved") cls = isMine ? "bg-primary border-primary text-primary-foreground" : "bg-warning/20 border-warning text-muted-foreground cursor-not-allowed";
                return (
                  <button
                    key={b.id}
                    disabled={b.status !== "available" || reserving === b.id || (!!reservation && !isMine)}
                    onClick={() => handleSelect(b.id, b.status)}
                    className={`aspect-square rounded-md border-2 flex flex-col items-center justify-center text-xs font-medium transition-all ${cls}`}
                    title={`Bed ${b.bed_number} — ${b.status}`}
                  >
                    {reserving === b.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bed className="h-4 w-4" />}
                    <span>{b.bed_number}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {reservation && (
          <div className="border-2 border-primary rounded-lg p-4 bg-primary/5 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 font-semibold">
                <Timer className="h-5 w-5 text-primary animate-pulse" />
                <span>Locked: {fmt(secondsLeft)}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleRelease}>Release</Button>
                <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => setPayOpen(true)}>
                  Complete Payment
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Your bed will be released automatically if payment isn't completed in time.</p>
          </div>
        )}
      </CardContent>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Bed Booking</DialogTitle></DialogHeader>
          <form onSubmit={handlePay} className="space-y-4">
            <div className="text-sm bg-muted/50 p-3 rounded-md flex items-center gap-2">
              <Timer className="h-4 w-4 text-primary" /> Time left: <span className="font-mono font-semibold">{fmt(secondsLeft)}</span>
            </div>
            <div className="space-y-1.5">
              <Label>Amount (₹)</Label>
              <Input type="number" min="1" required value={payForm.amount} onChange={e => setPayForm({ amount: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Proof (optional)</Label>
              <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={e => setProofFile(e.target.files?.[0] || null)} />
              <div className="flex items-center gap-2 flex-wrap">
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4" /> {proofFile ? "Change File" : "Upload Proof"}
                </Button>
                {proofFile && <span className="text-xs text-muted-foreground flex items-center gap-1"><FileCheck className="h-3 w-3 text-success" /> {proofFile.name}</span>}
              </div>
            </div>
            <Button type="submit" disabled={paying || secondsLeft === 0} className="w-full gradient-primary text-primary-foreground">
              {paying && <Loader2 className="h-4 w-4 animate-spin mr-1" />} Confirm & Book
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
