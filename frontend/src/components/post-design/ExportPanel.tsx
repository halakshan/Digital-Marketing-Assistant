"use client";

import { useState } from "react";
import { getIdToken } from "firebase/auth";

interface Props {
  onOpenCanva: () => void;
  onEdit: () => void;
  onNewDesign: () => void;
  firebaseUser?: any;
  templateId?: number;
  templateName?: string;
  headline?: string;
  subtext?: string;
  ctaText?: string;
  brandName?: string;
  size?: string;
  previewRef?: React.RefObject<HTMLDivElement>;
  canvaUrl?: string;
}

export default function ExportPanel({
  onOpenCanva, onEdit, onNewDesign,
  firebaseUser, templateId, templateName, headline, subtext, ctaText, brandName, size,
  previewRef, canvaUrl,
}: Props) {
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [downloading,setDownloading]= useState(false);

  // Download the preview as PNG using html2canvas
  const handleDownloadPNG = async () => {
    if (!previewRef?.current) {
      alert("Preview not found. Please go back and try again.");
      return;
    }
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(previewRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });
      const url = canvas.toDataURL("image/png");
      const a   = document.createElement("a");
      a.href    = url;
      a.download = `post-design-${Date.now()}.png`;
      a.click();
    } catch (err) {
      console.error("Download failed:", err);
      alert("Download failed. Please try the Canva option.");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadJPG = async () => {
    if (!previewRef?.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(previewRef.current, { backgroundColor: "#ffffff", scale: 2, useCORS: true });
      const url    = canvas.toDataURL("image/jpeg", 0.95);
      const a      = document.createElement("a");
      a.href       = url;
      a.download   = `post-design-${Date.now()}.jpg`;
      a.click();
    } catch { alert("Download failed."); }
    finally { setDownloading(false); }
  };

  const handleCopy = async () => {
    if (!previewRef?.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        alert("Copied to clipboard!");
      });
    } catch { alert("Copy not supported in this browser. Please use Download instead."); }
  };

  const handleSave = async () => {
    if (!firebaseUser) return;
    setSaving(true);
    try {
      const token = await getIdToken(firebaseUser);
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/design/save-design`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ templateId, templateName, headline, subtext, ctaText, brandName, size }),
      });
      setSaved(true);
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">

      {/* Success */}
      <div className="bg-green-500/10 border border-green-500/25 rounded-2xl p-5">
        <div className="text-sm font-bold text-green-400 mb-1">✅ Design Ready!</div>
        <div className="text-xs text-gray-400">Download your post or edit further in Canva for advanced effects.</div>
      </div>

      {/* Export Options */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-gray-200">Export Options</h3>

        <button type="button" onClick={handleDownloadPNG} disabled={downloading}
          className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-white/30 rounded-xl transition-all text-left disabled:opacity-50">
          <span className="text-xl">🖼️</span>
          <div className="flex-1">
            <div className="text-sm font-semibold">Download as PNG</div>
            <div className="text-xs text-gray-400">High quality, transparent background</div>
          </div>
          <span className="text-gray-500 text-sm">{downloading ? "..." : "→"}</span>
        </button>

        <button type="button" onClick={handleDownloadJPG} disabled={downloading}
          className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-white/30 rounded-xl transition-all text-left disabled:opacity-50">
          <span className="text-xl">📸</span>
          <div className="flex-1">
            <div className="text-sm font-semibold">Download as JPG</div>
            <div className="text-xs text-gray-400">Smaller file size, white background</div>
          </div>
          <span className="text-gray-500 text-sm">{downloading ? "..." : "→"}</span>
        </button>

        <a href={canvaUrl || "https://www.canva.com/templates"} target="_blank" rel="noreferrer"
          className="w-full flex items-center gap-3 p-3 bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/40 rounded-xl transition-all">
          <span className="text-xl">🎨</span>
          <div className="flex-1">
            <div className="text-sm font-semibold text-white">Edit in Canva</div>
            <div className="text-xs text-gray-400">Open similar template in Canva's full editor</div>
          </div>
          <span className="text-white text-sm">↗</span>
        </a>

        <button type="button" onClick={handleCopy}
          className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-white/30 rounded-xl transition-all text-left">
          <span className="text-xl">📋</span>
          <div className="flex-1">
            <div className="text-sm font-semibold">Copy to Clipboard</div>
            <div className="text-xs text-gray-400">Paste directly into your post or message</div>
          </div>
          <span className="text-gray-500 text-sm">→</span>
        </button>

        {firebaseUser && (
          <button type="button" onClick={handleSave} disabled={saving || saved}
            className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-green-500/30 rounded-xl transition-all text-left disabled:opacity-50">
            <span className="text-xl">💾</span>
            <div className="flex-1">
              <div className="text-sm font-semibold">{saved ? "Saved!" : "Save to My Designs"}</div>
              <div className="text-xs text-gray-400">Save this design to your account</div>
            </div>
            <span className="text-gray-500 text-sm">{saving ? "..." : saved ? "✓" : "→"}</span>
          </button>
        )}
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onEdit}
          className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-2xl font-semibold text-sm transition-all">
          ← Edit
        </button>
        <button type="button" onClick={onNewDesign}
          className="flex-1 bg-white hover:bg-gray-200 text-black py-3 rounded-2xl font-bold text-sm transition-all">
          + New Design
        </button>
      </div>
    </div>
  );
}
