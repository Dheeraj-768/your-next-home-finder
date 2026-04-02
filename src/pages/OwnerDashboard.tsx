import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, CheckCircle2, Clock, Building2, Upload, Trash2, X, ImageIcon, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type ListingWithImages = Tables<"pg_listings"> & { pg_images: Tables<"pg_images">[] };

export default function OwnerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<ListingWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [managingId, setManagingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchListings = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("pg_listings")
      .select("*, pg_images(*)")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setListings(data as ListingWithImages[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const uploadFiles = async (files: File[], listingId: string, is360 = false) => {
    if (!user) return;
    setUploading(true);
    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${listingId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("pg-images").upload(path, file);
      if (uploadError) { toast.error(`Upload failed: ${uploadError.message}`); continue; }
      const { data: { publicUrl } } = supabase.storage.from("pg-images").getPublicUrl(path);
      await supabase.from("pg_images").insert({ pg_id: listingId, image_url: publicUrl, is_360: is360 });
    }
    toast.success(`${files.length} image(s) uploaded`);
    setUploading(false);
    fetchListings();
  };

  const handleDrop = (e: React.DragEvent, listingId: string, is360 = false) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (files.length) uploadFiles(files, listingId, is360);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, listingId: string, is360 = false) => {
    const files = Array.from(e.target.files || []);
    if (files.length) uploadFiles(files, listingId, is360);
    e.target.value = "";
  };

  const deleteImage = async (imageId: string) => {
    const { error } = await supabase.from("pg_images").delete().eq("id", imageId);
    if (error) { toast.error(error.message); return; }
    toast.success("Image deleted");
    fetchListings();
  };

  const verified = listings.filter((l) => l.verified);
  const pending = listings.filter((l) => !l.verified);
  const managedListing = listings.find(l => l.id === managingId);

  return (
    <div className="min-h-screen pt-16 pb-24 md:pb-8">
      <div className="container py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">Owner Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage your PG listings</p>
            </div>
            <Button onClick={() => navigate("/owner/create")} className="gradient-primary text-primary-foreground shadow-glow">
              <Plus className="w-4 h-4 mr-2" /> Add PG
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-card rounded-xl border border-border p-5 text-center">
              <Building2 className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="font-display text-2xl font-bold text-foreground">{listings.length}</p>
              <p className="text-xs text-muted-foreground">Total Listings</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-5 text-center">
              <CheckCircle2 className="w-6 h-6 text-success mx-auto mb-2" />
              <p className="font-display text-2xl font-bold text-foreground">{verified.length}</p>
              <p className="text-xs text-muted-foreground">Verified</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-5 text-center">
              <Clock className="w-6 h-6 text-warning mx-auto mb-2" />
              <p className="font-display text-2xl font-bold text-foreground">{pending.length}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : listings.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-xl border border-border">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-display font-semibold text-foreground mb-1">No listings yet</p>
              <p className="text-sm text-muted-foreground mb-4">Create your first PG listing to get started</p>
              <Button onClick={() => navigate("/owner/create")} className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" /> Create Listing</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map((listing) => (
                <div key={listing.id} className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="p-4 flex items-center gap-4">
                    <div className="w-16 h-12 rounded-lg overflow-hidden bg-secondary shrink-0">
                      {listing.pg_images?.[0] && <img src={listing.pg_images[0].image_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-foreground text-sm truncate">{listing.title}</h3>
                      <p className="text-xs text-muted-foreground">{listing.location} · ₹{listing.price.toLocaleString()}/mo</p>
                    </div>
                    <Badge variant={listing.verified ? "default" : "secondary"} className={listing.verified ? "bg-success text-success-foreground" : ""}>
                      {listing.verified ? "Verified" : "Pending"}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => setManagingId(managingId === listing.id ? null : listing.id)}>
                      <ImageIcon className="w-4 h-4 mr-1" /> Images
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/pg/${listing.id}`)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Image Management Panel */}
                  {managingId === listing.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="border-t border-border p-4 bg-secondary/30">
                      <h4 className="text-sm font-semibold text-foreground mb-3">Manage Images</h4>

                      {/* Drag & Drop Zone */}
                      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFileSelect(e, listing.id, false)} />
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => handleDrop(e, listing.id, false)}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors mb-3 ${
                          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm font-medium text-foreground">Drag & drop images or click to upload</p>
                        <p className="text-xs text-muted-foreground mt-1">Supports JPG, PNG, WebP</p>
                      </div>

                      {/* 360 Upload */}
                      <input id={`360-${listing.id}`} type="file" accept="image/*" multiple className="hidden"
                        onChange={(e) => handleFileSelect(e, listing.id, true)} />
                      <Button variant="outline" size="sm" className="mb-4"
                        onClick={() => document.getElementById(`360-${listing.id}`)?.click()}>
                        <Upload className="w-3 h-3 mr-1" /> Upload 360° Images
                      </Button>

                      {uploading && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" /> Uploading...
                        </div>
                      )}

                      {/* Current Images */}
                      {listing.pg_images.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {listing.pg_images.map((img) => (
                            <div key={img.id} className="relative group rounded-lg overflow-hidden border border-border aspect-video">
                              <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                              {img.is_360 && (
                                <span className="absolute top-1 left-1 px-2 py-0.5 rounded text-xs font-medium bg-primary text-primary-foreground">360°</span>
                              )}
                              <button onClick={() => deleteImage(img.id)}
                                className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No images uploaded yet</p>
                      )}
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
