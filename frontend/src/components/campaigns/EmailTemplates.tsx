const TEMPLATES = [
  { name: "Promotional Sale",   icon: "💰", desc: "Announce discounts and offers"    },
  { name: "Product Newsletter", icon: "📰", desc: "Share new products and updates"   },
  { name: "Event Invitation",   icon: "🎤", desc: "Invite subscribers to your event" },
  { name: "Welcome Email",      icon: "👋", desc: "Greet new subscribers warmly"     },
  { name: "Re-engagement",      icon: "💬", desc: "Win back inactive subscribers"    },
  { name: "Order Confirmation", icon: "✅", desc: "Confirm purchases automatically"  },
];

interface Props {
  onUseTemplate: () => void;
}

export default function EmailTemplates({ onUseTemplate }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {TEMPLATES.map((t, i) => (
        <div key={i} className="bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-blue-500/30 rounded-2xl p-5 transition-all group cursor-pointer">
          <div className="text-3xl mb-3">{t.icon}</div>
          <div className="text-sm font-bold mb-1">{t.name}</div>
          <div className="text-xs text-gray-400 mb-4">{t.desc}</div>
          <button type="button" onClick={onUseTemplate}
            className="text-xs text-blue-400 group-hover:text-blue-300 font-semibold transition-colors">
            Use Template →
          </button>
        </div>
      ))}
    </div>
  );
}