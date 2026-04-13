import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  listing: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EditPropertyForm({ listing, onSuccess, onCancel }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: listing.title || "",
    description: listing.description || "",
    location: listing.location || "",
    price: String(listing.price || ""),
    gender: listing.gender || "co-ed",
    occupancy: listing.occupancy || "Double Sharing",
    vacancies: String(listing.vacancies ?? "1"),
    wifi: listing.wifi || false,
    food: listing.food || false,
    ac: listing.ac || false,
    water: listing.water || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("pg_listings").update({
      title: form.title,
      description: form.description,
      location: form.location,
      price: parseFloat(form.price),
      gender: form.gender,
      occupancy: form.occupancy,
      vacancies: parseInt(form.vacancies),
      wifi: form.wifi,
      food: form.food,
      ac: form.ac,
      water: form.water,
    }).eq("id", listing.id);
    setLoading(false);
    if (error) {
      toast.error("Update failed: " + error.message);
    } else {
      toast.success("Property updated!");
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Property Name</Label>
          <Input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Location</Label>
          <Input required value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Rent (₹/month)</Label>
          <Input type="number" required min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Vacancies</Label>
          <Input type="number" min="0" value={form.vacancies} onChange={e => setForm(f => ({ ...f, vacancies: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Gender</Label>
          <Select value={form.gender} onValueChange={v => setForm(f => ({ ...f, gender: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="co-ed">Co-Ed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Occupancy</Label>
          <Select value={form.occupancy} onValueChange={v => setForm(f => ({ ...f, occupancy: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Single">Single</SelectItem>
              <SelectItem value="Double Sharing">Double Sharing</SelectItem>
              <SelectItem value="Triple Sharing">Triple Sharing</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      </div>
      <div className="flex flex-wrap gap-6">
        {(["wifi", "food", "ac", "water"] as const).map(k => (
          <label key={k} className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={form[k]} onCheckedChange={v => setForm(f => ({ ...f, [k]: !!v }))} />
            <span className="capitalize">{k}</span>
          </label>
        ))}
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading} className="gradient-primary text-primary-foreground">
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-1" />} Save Changes
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
