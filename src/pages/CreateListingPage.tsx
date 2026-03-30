import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { addListing, type ManagedListing } from "@/data/listingsStore";
import { allFacilities, cities } from "@/data/mockData";
import { toast } from "sonner";

export default function CreateListingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("Bangalore");
  const [address, setAddress] = useState("");
  const [rent, setRent] = useState("");
  const [description, setDescription] = useState("");
  const [occupancy, setOccupancy] = useState("Double Sharing");
  const [gender, setGender] = useState<"male" | "female" | "co-ed">("co-ed");
  const [vacancies, setVacancies] = useState("");
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [panoramaUrl, setPanoramaUrl] = useState("");

  const toggleFacility = (f: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  };

  const addImage = () => {
    if (imageUrl.trim() && images.length < 6) {
      setImages((prev) => [...prev, imageUrl.trim()]);
      setImageUrl("");
    }
  };

  const removeImage = (i: number) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = () => {
    if (!name || !location || !rent || !description) {
      toast.error("Please fill in all required fields");
      return;
    }

    const listing: ManagedListing = {
      id: `pg-${Date.now()}`,
      name,
      ownerName: user?.name || "Unknown",
      location: `${location}, ${city}`,
      city,
      address,
      rent: parseInt(rent),
      description,
      images: images.length > 0 ? images : ["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800"],
      panoramaUrl: panoramaUrl || undefined,
      facilities: selectedFacilities,
      rating: 0,
      reviewCount: 0,
      vacancies: parseInt(vacancies) || 0,
      occupancy,
      gender,
      nearbyPlaces: [],
      ratings: { food: 0, cleanliness: 0, wifi: 0, safety: 0 },
      status: "pending",
      ownerId: user?.id || "",
      createdAt: new Date().toISOString().split("T")[0],
    };

    addListing(listing);
    toast.success("Listing submitted for admin approval!");
    navigate("/owner");
  };

  return (
    <div className="min-h-screen pt-16 pb-24 md:pb-8">
      <div className="container max-w-2xl py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">Create New PG Listing</h1>
          <p className="text-sm text-muted-foreground mb-6">Your listing will be reviewed by admin before going live.</p>

          <div className="space-y-5">
            {/* Basic Info */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">PG Name *</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sunrise PG for Men" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">City *</label>
                    <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                      {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Area / Locality *</label>
                    <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Koramangala" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Full Address</label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street address" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Description *</label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your PG..." className="resize-none" rows={3} />
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base">Pricing & Details</CardTitle>
              </CardHeader>
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
                      {["Single", "Double Sharing", "Triple Sharing", "Single & Double"].map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Gender</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value as typeof gender)} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="co-ed">Co-ed</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Facilities */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base">Facilities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {allFacilities.map((f) => (
                    <button
                      key={f}
                      onClick={() => toggleFacility(f)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        selectedFacilities.includes(f)
                          ? "gradient-primary text-primary-foreground border-transparent"
                          : "bg-card text-muted-foreground border-border hover:bg-secondary"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Images */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> Images
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Paste image URL..." className="flex-1" />
                  <Button variant="outline" size="sm" onClick={addImage} disabled={!imageUrl.trim() || images.length >= 6}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((img, i) => (
                      <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-border">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => removeImage(i)} className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">360° Panorama Image URL (optional)</label>
                  <Input value={panoramaUrl} onChange={(e) => setPanoramaUrl(e.target.value)} placeholder="Paste panorama image URL..." />
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleSubmit} className="w-full gradient-primary text-primary-foreground shadow-glow" size="lg">
              <Upload className="w-4 h-4 mr-2" /> Submit for Approval
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
