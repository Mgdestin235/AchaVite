"use client";

import { useRef, useState } from "react";
import { FileText, BookOpen, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { uploadFile } from "@/lib/uploadClient";
import type { ProductFile, ProductFileKind } from "@/lib/types";

const CONFIG: Record<ProductFileKind, { label: string; addLabel: string; accept: string; icon: typeof FileText }> = {
  pdf: { label: "Fichiers PDF", addLabel: "Ajouter un PDF", accept: "application/pdf", icon: FileText },
  ebook: {
    label: "Ebooks",
    addLabel: "Ajouter un ebook",
    accept: "application/pdf,application/epub+zip,application/x-mobipocket-ebook",
    icon: BookOpen,
  },
};

export function DocumentUploadList({
  kind,
  files,
  onChange,
}: {
  kind: ProductFileKind;
  files: ProductFile[];
  onChange: (files: ProductFile[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { label, addLabel, accept, icon: Icon } = CONFIG[kind];
  const items = files.filter((f) => f.kind === kind);
  const others = files.filter((f) => f.kind !== kind);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    try {
      const added: ProductFile[] = [];
      for (const file of Array.from(fileList)) {
        const url = await uploadFile(file, kind);
        added.push({ id: crypto.randomUUID(), name: file.name, url, kind });
      }
      onChange([...others, ...items, ...added]);
      toast.success(`${added.length} fichier${added.length > 1 ? "s" : ""} ajouté${added.length > 1 ? "s" : ""}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec du téléversement");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(id: string) {
    onChange(files.filter((f) => f.id !== id));
  }

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-500">{label}</label>
      <div className="space-y-1.5">
        {items.map((f) => (
          <div key={f.id} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
            <Icon size={16} className="shrink-0 text-navy" />
            <span className="min-w-0 flex-1 truncate text-sm text-navy">{f.name}</span>
            <button
              type="button"
              onClick={() => remove(f.id)}
              className="shrink-0 rounded-lg p-1 text-red-500 hover:bg-red-50"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 py-2.5 text-xs font-medium text-gray-400 hover:border-orange hover:text-orange disabled:opacity-50"
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          {addLabel}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
