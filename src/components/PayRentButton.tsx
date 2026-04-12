import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CreditCard, Loader2 } from "lucide-react";

interface Props {
  pgId: string;
  pgTitle: string;
}

export default function PayRentButton({ pgId, pgTitle }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ roomNumber: "", amount: "" });

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    // Get the owner of this PG
    const { data: pgData } = await supabase
      .from("pg_listings")
      .select("owner_id")
      .eq("id", pgId)
      .single();

    // Insert payment
    const { error: payError } = await supabase.from("payments").insert({
      user_id: user.id,
      pg_id: pgId,
      room_number: form.roomNumber,
      amount: parseFloat(form.amount),
      status: "paid",
      payment_date: new Date().toISOString(),
    });

    if (payError) {
      toast.error("Payment failed: " + payError.message);
      setLoading(false);
      return;
    }

    // Create notification for the owner
    if (pgData?.owner_id) {
      await supabase.from("notifications").insert({
        owner_id: pgData.owner_id,
        message: `Room ${form.roomNumber} - ${user.email} paid ₹${form.amount} for ${pgTitle}`,
      });
    }

    toast.success("Payment recorded successfully!");
    setLoading(false);
    setOpen(false);
    setForm({ roomNumber: "", amount: "" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gap-1.5 gradient-primary text-primary-foreground">
          <CreditCard className="h-4 w-4" /> Pay Rent
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pay Rent - {pgTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handlePay} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Room Number</Label>
            <Input required value={form.roomNumber} onChange={e => setForm(f => ({ ...f, roomNumber: e.target.value }))} placeholder="e.g. 101" />
          </div>
          <div className="space-y-1.5">
            <Label>Amount (₹)</Label>
            <Input type="number" required min="1" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="e.g. 8000" />
          </div>
          <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-1" />} Confirm Payment
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
