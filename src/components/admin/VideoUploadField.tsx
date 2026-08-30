"use client";

import { useRef, useState } from "react";
import { Loader2, Video, X } from "lucide-react";
import { toast } from "sonner";
import { uploadFile } from "@/lib/uploadClient";

export function VideoUploadField({
  videoUrl,
  onChange,
}: {
  videoUrl?: string;
  onChange: (url: string | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, "video");
      onChange(url);
      toast.success("Vidéo ajoutée");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec du téléversement de la vidéo");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-500">Vidéo du produit</label>
      {videoUrl ? (
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
          <video src={videoUrl} className="h-14 w-20 shrink-0 rounded-md bg-black object-cover" muted />
          <span className="flex-1 truncate text-sm text-navy">Vidéo ajoutée</span>
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 py-3 text-sm text-gray-400 hover:border-orange hover:text-orange disabled:opacity-50"
        >
          {uploading ? <Loader2 size={18} className="animate-spin" /> : <Video size={18} />}
          Ajouter une vidéo
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={(e) => handleFile(e.target.files)}
      />
    </div>
  );
}
