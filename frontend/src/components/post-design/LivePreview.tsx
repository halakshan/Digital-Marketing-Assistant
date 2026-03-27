import { forwardRef } from "react";
import { SIZES, Template } from "./postDesignData";

interface Props {
  template: Template;
  selectedSize: string;
  headline: string;
  subtext: string;
  ctaText: string;
  brandName: string;
  large?: boolean;
}

// forwardRef so parent can capture the preview element for html2canvas download
const LivePreview = forwardRef<HTMLDivElement, Props>(function LivePreview(
  { template, selectedSize, headline, subtext, ctaText, brandName, large },
  ref
) {
  const size     = large ? "w-72 h-72" : "w-64 h-64";
  const sizeInfo = SIZES.find(s => s.label === selectedSize);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gray-200">{large ? "Final Preview" : "Live Preview"}</h3>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-center min-h-[320px]">
        <div
          ref={ref}
          className={`${size} rounded-2xl bg-gradient-to-br ${template.bg} ${large ? "border-2 shadow-2xl" : "border"} ${template.border} flex flex-col items-center justify-center gap-3 p-6 text-center relative overflow-hidden`}>
          {/* Background watermark emoji */}
          <div className="absolute inset-0 opacity-10">
            <div className={`absolute top-2 right-2 ${large ? "text-8xl" : "text-6xl"}`}>{template.emoji}</div>
          </div>
          {/* Main emoji */}
          <div className={`${large ? "text-5xl" : "text-4xl"} mb-2`}>{template.emoji}</div>
          {/* Headline */}
          <div className={`${large ? "text-lg" : "text-base"} font-extrabold text-white leading-tight`}>
            {headline || "YOUR HEADLINE"}
          </div>
          {/* Subtext */}
          {subtext   && <div className="text-xs text-white/70">{subtext}</div>}
          {/* CTA */}
          {ctaText   && <div className="bg-white text-black text-xs font-bold px-4 py-1.5 rounded-full mt-1">{ctaText}</div>}
          {/* Brand */}
          {brandName && <div className="text-xs text-white/50 mt-1">{brandName}</div>}
        </div>
      </div>
      {sizeInfo && (
        <div className="text-center text-xs text-gray-500">{sizeInfo.size} · {sizeInfo.ratio}</div>
      )}
    </div>
  );
});

export default LivePreview;
