// Video ad form configuration options
export const AD_STYLES = [
  { value: "cinematic",    label: "🎥 Cinematic",    desc: "Epic, movie-like visuals"       },
  { value: "minimalist",   label: "⬜ Minimalist",   desc: "Clean, product-focused"         },
  { value: "energetic",    label: "⚡ Energetic",    desc: "Fast cuts, vibrant energy"      },
  { value: "storytelling", label: "📖 Storytelling", desc: "Narrative-driven emotional arc" },
  { value: "testimonial",  label: "👤 Testimonial",  desc: "Customer review style"          },
  { value: "slideshow",    label: "🖼️ Slideshow",    desc: "Product showcase with text"     },
];

export const DURATIONS  = ["15 seconds", "30 seconds", "60 seconds", "90 seconds"];
export const LANGUAGES  = ["English", "Sinhala", "Tamil"];
export const MOODS      = ["Exciting", "Emotional", "Luxury", "Playful", "Urgent", "Inspirational"];

export const PLATFORMS = [
  { value: "instagram_reels", label: "Instagram Reels",  icon: "📸", ratio: "9:16"  },
  { value: "facebook",        label: "Facebook Feed",    icon: "👍", ratio: "1:1"   },
  { value: "youtube",         label: "YouTube Pre-roll", icon: "▶️", ratio: "16:9"  },
  { value: "tiktok",          label: "TikTok",           icon: "🎵", ratio: "9:16"  },
];

export function statusStyle(s: string) {
  if (s === "completed")    return "bg-green-500/15 text-green-400 border-green-500/30";
  if (s === "generating")   return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
  if (s === "prompt_ready") return "bg-blue-500/15 text-blue-400 border-blue-500/30";
  return "bg-gray-500/15 text-gray-400 border-gray-500/30";
}
