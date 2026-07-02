"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function UploadSection() {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      alert(`Success! Added ${data.words?.length || 0} words.`);
      router.refresh();
      setPreview(null);
    } catch (error: any) {
      alert(error.message);
      setPreview(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="glass-panel" style={{ padding: "30px 20px", textAlign: "center" }}>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {isUploading ? (
        <div style={{ padding: "20px" }}>
          <div className="spinner" style={{ margin: "0 auto 16px" }}></div>
          <p>Extracting words with AI...</p>
        </div>
      ) : preview ? (
        <div>
          <img src={preview} alt="Preview" style={{ maxHeight: "200px", borderRadius: "8px", marginBottom: "16px", maxWidth: "100%", objectFit: "contain" }} />
          <p>Processing...</p>
        </div>
      ) : (
        <div onClick={() => fileInputRef.current?.click()} style={{ cursor: "pointer" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📸</div>
          <h3 style={{ marginBottom: "8px", fontWeight: "600" }}>Upload Screenshot</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Take a screenshot of your vocab list and tap here to extract the words.
          </p>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-left-color: var(--accent-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
