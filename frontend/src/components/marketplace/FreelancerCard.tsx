import { Freelancer } from "./freelancerData";

interface Props {
  freelancer: Freelancer;
  hiredId: number | null;
  onHire: (f: Freelancer) => void;
}

export default function FreelancerCard({ freelancer: f, hiredId, onHire }: Props) {
  return (
    <div className="bg-white/5 border border-white/10 hover:border-fuchsia-500/30 rounded-2xl p-5 transition-all hover:-translate-y-1 group">

      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center font-extrabold text-lg flex-shrink-0`}>
          {f.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold truncate">{f.name}</span>
            {f.verified && <span className="text-blue-400 text-xs">✓</span>}
          </div>
          <div className="text-xs text-fuchsia-400 font-semibold">{f.role}</div>
          <div className="text-xs text-gray-500">📍 {f.location}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xs font-bold text-yellow-400">⭐ {f.rating}</div>
          <div className="text-xs text-gray-500">{f.reviews} reviews</div>
        </div>
      </div>

      {/* Bio */}
      <p className="text-xs text-gray-400 leading-relaxed mb-4 line-clamp-2">{f.bio}</p>

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {f.skills.map(skill => (
          <span key={skill} className="text-xs bg-white/10 border border-white/10 text-gray-300 px-2 py-0.5 rounded-full">
            {skill}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <div>
          <div className="text-sm font-bold text-white">{f.rate}</div>
          <div className="text-xs text-gray-500">{f.projects} projects done</div>
        </div>
        <div className="flex gap-2">
          <button type="button"
            className="text-xs bg-white/10 hover:bg-white/15 border border-white/10 text-gray-300 px-3 py-1.5 rounded-lg transition-all font-semibold">
            💬 Message
          </button>
          {hiredId === f.id ? (
            <span className="text-xs bg-green-500/15 border border-green-500/30 text-green-400 px-3 py-1.5 rounded-lg font-semibold">
              ✓ Hired
            </span>
          ) : (
            <button type="button" onClick={() => onHire(f)}
              className={`text-xs bg-gradient-to-r ${f.gradient} hover:opacity-90 px-3 py-1.5 rounded-lg transition-all font-semibold`}>
              Hire →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}