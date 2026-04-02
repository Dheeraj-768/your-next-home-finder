import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ALL_FACILITIES = ["WiFi", "Food", "AC", "Water", "Hot Water", "Laundry", "Gym", "Parking", "CCTV", "Power Backup", "Housekeeping", "Security Guard", "Terrace"];

export default function CreateListingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [rent, setRent] = useState("");
  const [description, setDescription] = useState("");
  const [occupancy, setOccupancy] = useState("Double Sharing");
  const [gender, setGender] = useState("co-ed");
  const [vacancies, setVacancies] = useState("");
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<{ file: File; preview: string; is360: boolean }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleFacility = (f: string) => {
    setSelectedFacilities((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const preview = URL.createObjectURL(file);
      setUploadedImages((prev) => [...prev, { file, preview, is360: false }]);
    });
  };

  const removeImage = (i: number) => {
    setUploadedImages((prev) => {
      URL.revokeObjectURL(prev[i].preview);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const toggle360 = (i: number) => {
    setUploadedImages((prev) => prev.map((img, idx) => idx === i ? { ...img, is360: !img.is360 } : img));
  };

  const handleSubmit = async () => {
    if (!name || !location || !rent || !description || !user) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create listing
      const { data: listing, error: listingError } = await supabase
        .from("pg_listings")
        .insert({
          owner_id: user.id,
          title: name,
          description,
          location,
          price: parseInt(rent),
          amenities: selectedFacilities,
          gender,
          occupancy,
          vacancies: parseInt(vacancies) || 0,
          verified: false,
        })
        .select()
        .single();

      if (listingError) throw listingError;

      // Upload images
      for (const img of uploadedImages) {
        const ext = img.file.name.split(".").pop();
        const path = `${user.id}/${listing.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("pg-images")
          .upload(path, img.file);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from("pg-images").getPublicUrl(path);
          await supabase.from("pg_images").insert({
            pg_id: listing.id,
            image_url: publicUrl,
            is_360: img.is360,
          });
        }
      }

      toast.success("Listing submitted for admin approval!");
      navigate("/owner");
    } catch (err: any) {
      toast.error(err.message || "Failed to create listing");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-16 pb-24 md:pb-8">
      <div className="container max-w-2xl py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">Create New PG Listing</h1>
          <p className="text-sm text-muted-foreground mb-6">Your listing will be reviewed by admin before going live.</p>

          <div className="space-y-5">
            <Card className="border-border">
              <CardHeader className="pb-3"><CardTitle className="font-display text-base">Basic Information</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">PG Name *</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sunrise PG for Men" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Location *</label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Koramangala, Bangalore" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Description *</label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your PG..." className="resize-none" rows={3} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-3"><CardTitle className="font-display text-base">Pricing & Details</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Monthly Rent (₹) *</label>
                    <Input type="number" value={rent} onChange={(e) => setRent(e.target.value)} placeholder="8500" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Vacancies</label>
                    <Input type="number" value={vacancies} onChange={(e) => setVacancies(e.target.value)} placeholder="5" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Occupancy</label>
                    <select value={occupancy} onChange={(e) => setOccupancy(e.target.value)} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                      {["Single", "Double Sharing", "Triple Sharing"].map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Gender</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="co-ed">Co-ed</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-3"><CardTitle className="font-display text-base">Facilities</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {ALL_FACILITIES.map((f) => (
                    <button key={f} onClick={() => toggleFacility(f)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        selectedFacilities.includes(f) ? "gradient-primary text-primary-foreground border-transparent" : "bg-card text-muted-foreground border-border hover:bg-secondary"
                      }`}>{f}</button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> Images
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                  <Upload className="w-4 h-4 mr-2" /> Upload Images
                </Button>
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {uploadedImages.map((img, i) => (
                      <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-border">
                        <img src={img.preview} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => removeImage(i)} className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground">
                          <X className="w-3 h-3" />
                        </button>
                        <button onClick={() => toggle360(i)}
                          className={`absolute bottom-1 left-1 px-2 py-0.5 rounded text-xs font-medium ${img.is360 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                          {img.is360 ? "360°" : "Normal"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full gradient-primary text-primary-foreground shadow-glow" size="lg">
              <Upload className="w-4 h-4 mr-2" /> {isSubmitting ? "Submitting..." : "Submit for Approval"}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
