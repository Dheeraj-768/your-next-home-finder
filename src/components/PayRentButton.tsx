import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CreditCard, Loader2, Upload, FileCheck } from "lucide-react";

interface Props {
  pgId: string;
  pgTitle: string;
}

export default function PayRentButton({ pgId, pgTitle }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ roomNumber: "", amount: "" });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofUploading, setProofUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    let proofUrl: string | null = null;

    // Upload proof if provided
    if (proofFile) {
      setProofUploading(true);
      const ext = proofFile.name.split(".").pop();
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("payment-proofs")
        .upload(path, proofFile, { upsert: false });
      if (uploadErr) {
        toast.error("Proof upload failed: " + uploadErr.message);
        setLoading(false);
        setProofUploading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("payment-proofs").getPublicUrl(path);
      proofUrl = urlData.publicUrl;
      setProofUploading(false);
    }

    const { error: payError } = await supabase.from("payments").insert({
      user_id: user.id,
      pg_id: pgId,
      room_number: form.roomNumber,
      amount: parseFloat(form.amount),
      status: "pending",
      payment_date: new Date().toISOString(),
      proof_url: proofUrl,
    });

    if (payError) {
      toast.error("Payment failed: " + payError.message);
      setLoading(false);
      return;
    }

    // Notification is now auto-created by DB trigger
    toast.success("Payment submitted for verification!");
    setLoading(false);
    setOpen(false);
    setForm({ roomNumber: "", amount: "" });
    setProofFile(null);
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
          <div className="space-y-1.5">
            <Label>Payment Proof (optional)</Label>
            <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={e => setProofFile(e.target.files?.[0] || null)} />
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-1.5">
                <Upload className="h-4 w-4" /> {proofFile ? "Change File" : "Upload Proof"}
              </Button>
              {proofFile && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <FileCheck className="h-4 w-4 text-success" /> {proofFile.name}
                </span>
              )}
            </div>
          </div>
          <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading || proofUploading}>
            {(loading || proofUploading) && <Loader2 className="h-4 w-4 animate-spin mr-1" />} Submit Payment
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
