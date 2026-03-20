const CONTENT_TYPES = [
  { value: "post",     label: "📝 Social Post"  },
  { value: "caption",  label: "💬 Caption"       },
  { value: "ad",       label: "📣 Ad Copy"       },
  { value: "email",    label: "📧 Email Subject" },
  { value: "hashtags", label: "# Hashtags"       },
  { value: "bio",      label: "👤 Bio"           },
];

interface Props {
  contentType: string;
  setContentType: (val: string) => void;
}

export default function ContentTypeSelector({ contentType, setContentType }: Props) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <label className="block text-sm font-semibold text-gray-200 mb-3">Content Type</label>
      <div className="grid grid-cols-3 gap-2">
        {CONTENT_TYPES.map(t => (
          <button key={t.value} type="button" onClick={() => setContentType(t.value)}
            className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              contentType === t.value
                ? "bg-violet-600 text-white border border-violet-500"
                : "bg-white/5 text-gray-400 border border-white/10 hover:border-violet-500/40 hover:text-white"
            }`}>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}