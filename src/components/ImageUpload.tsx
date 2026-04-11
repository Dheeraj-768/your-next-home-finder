import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Upload, Loader2, X, Image as ImageIcon } from "lucide-react";

interface Props {
  pgId: string;
  onUploaded: () => void;
}

export default function ImageUpload({ pgId, onUploaded }: Props) {
  const [uploading, setUploading] = useState(false);
  const [is360, setIs360] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `${pgId}/${crypto.randomUUID()}.${ext}`;

    const { error: storageError } = await supabase.storage
      .from("pg-images")
      .upload(path, file, { upsert: false });

    if (storageError) {
      toast.error("Upload failed: " + storageError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("pg-images").getPublicUrl(path);

    const { error: dbError } = await supabase.from("pg_images").insert({
      pg_id: pgId,
      image_url: urlData.publicUrl,
      is_360: is360,
    });

    setUploading(false);
    if (dbError) {
      toast.error("Failed to save image record: " + dbError.message);
    } else {
      toast.success(is360 ? "360° image uploaded!" : "Image uploaded!");
      onUploaded();
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      <Button
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
        className="gap-1.5"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        Upload Image
      </Button>
      <label className="flex items-center gap-2 cursor-pointer text-sm">
        <Checkbox checked={is360} onCheckedChange={v => setIs360(!!v)} />
        360° panorama
      </label>
    </div>
  );
}