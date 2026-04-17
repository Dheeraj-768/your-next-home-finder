import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Bed, Loader2, Plus, Trash2, DoorOpen } from "lucide-react";

interface Props {
  pgId: string;
  pgTitle: string;
}

export default function ManageRoomsDialog({ pgId, pgTitle }: Props) {
  const [open, setOpen] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  const [beds, setBeds] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ roomNumber: "", totalBeds: 4 });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: rs } = await supabase
      .from("rooms")
      .select("*")
      .eq("pg_id", pgId)
      .order("room_number");
    if (rs && rs.length) {
      const ids = rs.map(r => r.id);
      const { data: bs } = await supabase.from("beds").select("*").in("room_id", ids).order("bed_number");
      const map: Record<string, any[]> = {};
      bs?.forEach(b => { (map[b.room_id] = map[b.room_id] || []).push(b); });
      setBeds(map);
    } else {
      setBeds({});
    }
    setRooms(rs || []);
    setLoading(false);
  };

  useEffect(() => { if (open) load(); }, [open]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.from("rooms").insert({
      pg_id: pgId,
      room_number: form.roomNumber,
      total_beds: form.totalBeds,
    });
    setSubmitting(false);
    if (error) toast.error(error.message);
    else {
      toast.success(`Room ${form.roomNumber} added with ${form.totalBeds} beds`);
      setForm({ roomNumber: "", totalBeds: 4 });
      load();
    }
  };

  const handleDelete = async (roomId: string) => {
    if (!confirm("Delete this room and all its beds? Existing bookings will block deletion.")) return;
    const { error } = await supabase.from("rooms").delete().eq("id", roomId);
    if (error) toast.error(error.message);
    else { toast.success("Room deleted"); load(); }
  };

  const bedColor = (status: string) => {
    if (status === "available") return "bg-success/15 text-success border-success/30";
    if (status === "reserved") return "bg-warning/15 text-warning border-warning/30";
    return "bg-destructive/15 text-destructive border-destructive/30";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <DoorOpen className="h-4 w-4" /> Manage Rooms
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Manage Rooms — {pgTitle}</DialogTitle></DialogHeader>

        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-[1fr_120px_auto] gap-2 items-end p-3 bg-muted/40 rounded-lg">
          <div className="space-y-1.5">
            <Label className="text-xs">Room Number</Label>
            <Input required placeholder="e.g. 101" value={form.roomNumber} onChange={e => setForm(f => ({ ...f, roomNumber: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Total Beds</Label>
            <Input type="number" min={1} max={20} required value={form.totalBeds} onChange={e => setForm(f => ({ ...f, totalBeds: parseInt(e.target.value) || 1 }))} />
          </div>
          <Button type="submit" disabled={submitting} className="gap-1.5">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
          </Button>
        </form>

        <div className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Loading...</p>
          ) : rooms.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No rooms yet. Add one above.</p>
          ) : rooms.map(r => (
            <div key={r.id} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold flex items-center gap-1.5"><DoorOpen className="h-4 w-4" /> Room {r.room_number} <span className="text-xs text-muted-foreground font-normal">({r.total_beds} beds)</span></h4>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(beds[r.id] || []).map(b => (
                  <Badge key={b.id} variant="outline" className={`gap-1 ${bedColor(b.status)}`}>
                    <Bed className="h-3 w-3" /> {b.bed_number} · {b.status}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
