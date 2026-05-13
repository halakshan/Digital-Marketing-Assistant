"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged, getIdToken } from "firebase/auth";
import {
  doc, getDoc, collection, query, where,
  getDocs, addDoc, onSnapshot, serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useIsFreelancer } from "@/hooks/useIsFreelancer";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar  from "@/components/dashboard/Topbar";
import StripePaymentModal from "@/components/marketplace/StripePaymentModal";

const API = `${process.env.NEXT_PUBLIC_API_URL}/api`;

// ── Types ─────────────────────────────────────────────────────────────────────
interface FreelancerProfile {
  uid:             string;
  fullName:        string;
  category:        string;
  bio:             string;
  skills:          string[];
  rate:            string;
  location:        string;
  profilePhoto:    string;
  verified:        boolean;
  rating:          number;
  reviewCount:     number;
  completedOrders: number;
  activeProjects:  number;
  available:       boolean;
  profileComplete: boolean;
  createdAt?:      any;
}
interface HireRequest {
  id: string; freelancerUid: string; freelancerName: string;
  projectDescription: string; budget: string;
  status: "pending"|"accepted"|"declined"|"completed";
  createdAt: any; updatedAt?: any; paid?: boolean;
}
interface Service {
  id: string; title: string; description: string;
  price: string; delivery: string; icon: string; category: string;
}
interface Payment {
  id: string; hireRequestId: string; clientUid: string;
  freelancerUid: string; freelancerName: string;
  amount: string|number; method: string;
  status: "pending"|"processing"|"escrowed"|"released"|"completed"|"failed";
  description?: string; createdAt: any;
  platformFee?: number; freelancerNet?: number;
}

interface ModalReview {
  id: string; clientName: string; stars: number; text: string; createdAt: any;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const GRADIENTS = [
  "from-violet-500 to-indigo-600",
  "from-purple-500 to-violet-600",
  "from-indigo-500 to-purple-600",
  "from-violet-600 to-indigo-700",
  "from-purple-600 to-violet-700",
  "from-indigo-600 to-purple-700",
  "from-violet-500 to-purple-700",
  "from-indigo-500 to-violet-700",
];
const CATEGORIES = [
  { key:"all",icon:"✨",label:"All" },
  { key:"designer",icon:"🎨",label:"Designers" },
  { key:"developer",icon:"💻",label:"Developers" },
  { key:"video",icon:"🎬",label:"Video" },
  { key:"photographer",icon:"📸",label:"Photography" },
  { key:"writer",icon:"✍️",label:"Writers" },
  { key:"influencer",icon:"⭐",label:"Influencers" },
  { key:"marketer",icon:"📊",label:"Marketers" },
];
const statusStyle: Record<string,string> = {
  pending:   "bg-yellow-500/15 border-yellow-500/30 text-yellow-400",
  accepted:  "bg-green-500/15 border-green-500/30 text-green-400",
  declined:  "bg-red-500/15 border-red-500/30 text-red-400",
  completed: "bg-blue-500/15 border-blue-500/30 text-blue-400",
};
const statusIcon: Record<string,string> = { pending:"🕐",accepted:"✅",declined:"❌",completed:"🏆" };
function gradFor(uid:string){ return GRADIENTS[(uid?.charCodeAt(0)||0)%GRADIENTS.length]; }

// ── Star Rating ───────────────────────────────────────────────────────────────
function Stars({ r, size=3 }: { r:number; size?:number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1,2,3,4,5].map(i=>(
        <svg key={i} className={`w-${size} h-${size} ${i<=Math.round(r)?"text-yellow-400":"text-white/15"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </span>
  );
}

// ── Freelancer Detail Modal ───────────────────────────────────────────────────
function FreelancerModal({ f, onClose, onHire, onMessage, alreadyHired }: {
  f: FreelancerProfile; onClose:()=>void;
  onHire:(f:FreelancerProfile)=>void; onMessage:(f:FreelancerProfile)=>void;
  alreadyHired:boolean;
}) {
  const [services,    setServices]    = useState<Service[]>([]);
  const [svcLoading,  setSvcLoading]  = useState(true);
  const [revs,        setRevs]        = useState<ModalReview[]>([]);
  const [revLoading,  setRevLoading]  = useState(true);
  const grad = gradFor(f.uid);

  // Load reviews for this freelancer directly from Firestore
  useEffect(()=>{
    setRevLoading(true);
    getDocs(query(collection(db,"reviews"), where("freelancerUid","==",f.uid)))
      .then(snap=>{
        const sorted = snap.docs
          .map(d=>({id:d.id,...d.data()} as ModalReview))
          .sort((a,b)=>{
            const ta=a.createdAt?.toDate?.()?.getTime?.()||0;
            const tb=b.createdAt?.toDate?.()?.getTime?.()||0;
            return tb-ta;
          });
        setRevs(sorted);
      })
      .catch(()=>{})
      .finally(()=>setRevLoading(false));
  },[f.uid]);

  useEffect(()=>{
    setSvcLoading(true);
    // Try active services first, fall back to all services for this freelancer
    const q = query(collection(db,"freelancer_services"), where("freelancerUid","==",f.uid));
    getDocs(q).then(snap=>{
      const all = snap.docs.map(d=>({id:d.id,...d.data()} as Service));
      setServices(all.filter(s=>(s as any).status==="active" || !(s as any).status ? true : false));
    }).finally(()=>setSvcLoading(false));
  },[f.uid]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div
        className="bg-[#0d0d1a] border border-white/15 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col"
        onClick={e=>e.stopPropagation()}>

        {/* ── Profile header ── */}
        <div className={`flex-shrink-0 bg-gradient-to-br ${grad} rounded-t-2xl p-6`}>
          {/* Close button */}
          <div className="flex justify-end mb-4">
            <button onClick={onClose}
              className="w-8 h-8 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white text-base transition-all">
              ✕
            </button>
          </div>

          {/* Avatar + Name row */}
          <div className="flex items-center gap-4">
            {f.profilePhoto
              ? <img src={f.profilePhoto} className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30 shadow-xl flex-shrink-0"/>
              : <div className="w-16 h-16 rounded-2xl bg-black/30 border-2 border-white/30 flex items-center justify-center font-extrabold text-2xl text-white flex-shrink-0 shadow-xl">
                  {f.fullName?.charAt(0)||"F"}
                </div>
            }
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-extrabold text-white">{f.fullName}</h2>
                {f.verified && <span className="text-[11px] bg-white/20 border border-white/30 text-white px-2 py-0.5 rounded-full font-bold">✓ PRO</span>}
              </div>
              <p className="text-sm text-white/80 font-semibold capitalize mt-0.5">{f.category||"Freelancer"}</p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {f.location && <span className="text-xs text-white/60">📍 {f.location}</span>}
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${f.available?"bg-green-500/30 border-green-400/50 text-green-300":"bg-black/30 border-white/20 text-white/50"}`}>
                  {f.available?"● Active":"○ Busy"}
                </span>
                {f.rate && <span className="text-xs bg-black/25 border border-white/20 text-white px-2.5 py-0.5 rounded-full font-bold">{f.rate}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="flex-shrink-0 grid grid-cols-3 divide-x divide-white/10 border-b border-white/10">
          {[
            { label:"Rating",    val: f.rating>0 ? f.rating.toFixed(1) : "New", sub: f.rating>0 ? <Stars r={f.rating} size={3}/> : null, color:"text-yellow-400" },
            { label:"Completed", val: f.completedOrders||0, sub: null, color:"text-green-400" },
            { label:"Reviews",   val: f.reviewCount||0,    sub: null, color:"text-blue-400"  },
          ].map(s=>(
            <div key={s.label} className="py-4 text-center">
              <p className={`text-2xl font-extrabold ${s.color}`}>{s.val}</p>
              {s.sub && <div className="flex justify-center mt-0.5">{s.sub}</div>}
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 px-6 py-5 space-y-5 overflow-y-auto">

          {/* About / Bio */}
          {f.bio ? (
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">About</p>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-sm text-gray-200 leading-relaxed">{f.bio}</p>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 italic">This freelancer hasn't added a bio yet.</p>
            </div>
          )}

          {/* Skills */}
          {(f.skills||[]).length > 0 && (
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">Skills</p>
              <div className="flex flex-wrap gap-2">
                {f.skills.map(s=>(
                  <span key={s} className="text-xs bg-violet-500/15 border border-violet-500/25 text-violet-300 px-3 py-1 rounded-full font-medium">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Services Offered */}
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">
              Services Offered {!svcLoading && <span className="text-gray-600 normal-case">({services.length})</span>}
            </p>

            {svcLoading ? (
              <div className="space-y-2">
                {[1,2].map(i=><div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse"/>)}
              </div>
            ) : services.length > 0 ? (
              <div className="space-y-2">
                {services.map(s=>(
                  <div key={s.id} className="flex items-center gap-4 bg-white/5 border border-white/10 hover:border-violet-500/30 rounded-xl p-4 transition-all">
                    <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl flex-shrink-0">
                      {s.icon||"🛠️"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">{s.title}</p>
                      {s.description && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">{s.description}</p>
                      )}
                      {s.category && (
                        <span className="text-[11px] bg-white/5 border border-white/10 text-gray-400 px-2 py-0.5 rounded-full mt-1 inline-block">{s.category}</span>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0 space-y-0.5">
                      <p className="text-base font-extrabold text-white">{s.price||"—"}</p>
                      {s.delivery && <p className="text-xs text-gray-500">⏱ {s.delivery}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                <div className="text-3xl mb-2">🛠️</div>
                <p className="text-sm text-gray-400 font-medium">No services listed yet</p>
                <p className="text-xs text-gray-600 mt-1">This freelancer hasn't added services. You can still send a hire request.</p>
              </div>
            )}
          </div>

          {/* ── Recent Reviews ── */}
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">
              Reviews {!revLoading && <span className="text-gray-600 normal-case">({revs.length})</span>}
            </p>

            {revLoading ? (
              <div className="space-y-2">
                {[1,2].map(i=><div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse"/>)}
              </div>
            ) : revs.length > 0 ? (
              <div className="space-y-2">
                {revs.slice(0,5).map(r=>(
                  <div key={r.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-violet-500/25 border border-violet-500/30 flex items-center justify-center text-xs font-bold text-violet-300 flex-shrink-0">
                          {r.clientName?.charAt(0)?.toUpperCase()||"C"}
                        </div>
                        <span className="text-xs font-semibold text-white">{r.clientName||"Client"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Stars r={r.stars} size={3}/>
                        <span className="text-xs font-bold text-yellow-400">{r.stars}.0</span>
                      </div>
                    </div>
                    {r.text ? (
                      <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">{r.text}</p>
                    ) : (
                      <p className="text-xs text-gray-600 italic">No written review</p>
                    )}
                    <p className="text-[11px] text-gray-600 mt-1.5">
                      {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : ""}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                <div className="text-3xl mb-2">⭐</div>
                <p className="text-sm text-gray-400 font-medium">No reviews yet</p>
                <p className="text-xs text-gray-600 mt-1">Be the first to work with and review {f.fullName}.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Sticky action footer ── */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-white/10 bg-[#0d0d1a] rounded-b-2xl flex gap-3">
          <button onClick={()=>onMessage(f)}
            className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white py-3 rounded-xl font-semibold text-sm transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            Send Message
          </button>
          {alreadyHired
            ? <div className="flex-1 flex items-center justify-center bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 py-3 rounded-xl font-semibold text-sm">
                🕐 Request Sent
              </div>
            : <button onClick={()=>{ onClose(); onHire(f); }}
                className={`flex-1 bg-gradient-to-r ${grad} hover:opacity-90 active:scale-[0.98] text-white py-3 rounded-xl font-bold text-sm transition-all shadow-lg`}>
                💼 Hire Now
              </button>
          }
        </div>
      </div>
    </div>
  );
}

// ── Hire Modal ────────────────────────────────────────────────────────────────
function HireModal({ f, onCancel, onConfirm, sending }: {
  f:FreelancerProfile; onCancel:()=>void;
  onConfirm:(desc:string,budget:string)=>void; sending:boolean;
}) {
  const [desc,   setDesc]   = useState("");
  const [budget, setBudget] = useState("");
  const grad = gradFor(f.uid);
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d0d1a] border border-white/15 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-5">
          {f.profilePhoto
            ? <img src={f.profilePhoto} className="w-12 h-12 rounded-xl object-cover"/>
            : <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center font-bold text-lg text-white`}>{f.fullName?.charAt(0)}</div>
          }
          <div>
            <h2 className="text-base font-bold text-white">Hire {f.fullName}</h2>
            <p className="text-xs text-violet-400 capitalize">{f.category||"Freelancer"} · {f.rate||"Rate negotiable"}</p>
          </div>
        </div>
        <p className="text-sm text-gray-400 mb-4">Describe your project. {f.fullName} will review and accept or decline.</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Project Description *</label>
            <textarea rows={4} value={desc} onChange={e=>setDesc(e.target.value)}
              placeholder="Describe what you need — scope, timeline, deliverables…"
              className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none transition-all resize-none"/>
          </div>
          <div>
            <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Your Budget (optional)</label>
            <input value={budget} onChange={e=>setBudget(e.target.value)} placeholder="e.g. LKR 25,000"
              className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none transition-all"/>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-xl font-semibold text-sm transition-all text-gray-300">Cancel</button>
          <button onClick={()=>desc.trim()&&onConfirm(desc,budget)} disabled={!desc.trim()||sending}
            className={`flex-1 bg-gradient-to-r ${grad} hover:opacity-90 disabled:opacity-40 py-3 rounded-xl font-bold text-sm transition-all text-white`}>
            {sending?"Sending…":"Send Request →"}
          </button>
        </div>
      </div>
    </div>
  );
}
// ── Freelancer Card ───────────────────────────────────────────────────────────
function FreelancerCard({ f, onHire, onMessage, onView, alreadyHired }: {
  f:FreelancerProfile; onHire:(f:FreelancerProfile)=>void;
  onMessage:(f:FreelancerProfile)=>void; onView:(f:FreelancerProfile)=>void;
  alreadyHired:boolean;
}) {
  const grad = gradFor(f.uid);
  const hasInfo = !!(f.bio || f.category || f.rate);

  return (
    <div onClick={()=>onView(f)}
      className="bg-[#0d0d1a] border border-white/10 rounded-2xl overflow-hidden hover:border-violet-500/50 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-200 flex flex-col cursor-pointer group">
      <div className={`h-1.5 bg-gradient-to-r ${grad}`}/>
      <div className="p-5 flex flex-col flex-1">

        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {f.profilePhoto
            ? <img src={f.profilePhoto} alt={f.fullName} className="w-14 h-14 rounded-2xl object-cover flex-shrink-0 border border-white/10"/>
            : <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center font-extrabold text-2xl flex-shrink-0 text-white shadow-lg`}>
                {f.fullName?.charAt(0)?.toUpperCase()||"F"}
              </div>
          }
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm font-bold text-white truncate">{f.fullName||"Freelancer"}</h3>
              {f.verified && <span className="text-[9px] bg-blue-500/20 border border-blue-400/30 text-blue-400 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">✓ PRO</span>}
            </div>
            <p className="text-xs text-violet-400 font-semibold capitalize mt-0.5">{f.category||"Freelancer"}</p>
            {f.location && <p className="text-[11px] text-gray-500 mt-0.5">📍 {f.location}</p>}
          </div>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full border flex-shrink-0 ${f.available?"bg-green-500/15 border-green-500/30 text-green-400":"bg-gray-500/15 border-gray-500/30 text-gray-500"}`}>
            {f.available?"● Active":"○ Busy"}
          </span>
        </div>

        {/* Bio */}
        {f.bio
          ? <p className="text-xs text-gray-400 leading-relaxed mb-3 line-clamp-2">{f.bio}</p>
          : <p className="text-xs text-gray-600 leading-relaxed mb-3 italic">Click to view profile details →</p>
        }

        {/* Skills */}
        {(f.skills||[]).length>0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {f.skills.slice(0,4).map(s=>(
              <span key={s} className="text-[11px] bg-white/8 border border-white/10 text-gray-300 px-2 py-0.5 rounded-full">{s}</span>
            ))}
            {f.skills.length>4 && <span className="text-[11px] text-gray-500">+{f.skills.length-4}</span>}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 mt-auto">
          {f.rating>0
            ? <div className="flex items-center gap-1"><Stars r={f.rating} size={3}/><span className="text-xs font-bold text-yellow-400">{f.rating.toFixed(1)}</span><span className="text-xs text-gray-500">({f.reviewCount})</span></div>
            : <span className="text-xs text-gray-600 italic">New member</span>
          }
          {f.completedOrders>0 && <span className="text-xs text-gray-500">🏆 {f.completedOrders} done</span>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/8" onClick={e=>e.stopPropagation()}>
          <div>
            {f.rate
              ? <span className="text-sm font-extrabold text-white">{f.rate}</span>
              : <span className="text-xs text-gray-500">Rate: Negotiable</span>
            }
          </div>
          <div className="flex items-center gap-2">
            <button onClick={e=>{e.stopPropagation();onMessage(f);}}
              className="flex items-center gap-1 text-xs bg-white/8 hover:bg-white/15 border border-white/10 hover:border-violet-400/40 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg transition-all font-semibold">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
              Chat
            </button>
            {alreadyHired
              ? <span className="text-xs bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 px-3 py-1.5 rounded-lg font-semibold">🕐 Sent</span>
              : <button onClick={e=>{e.stopPropagation();onHire(f);}}
                  className={`text-xs bg-gradient-to-r ${grad} hover:opacity-90 active:scale-95 text-white px-4 py-1.5 rounded-lg transition-all font-bold shadow-lg`}>
                  Hire →
                </button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Review Modal ──────────────────────────────────────────────────────────────
function ReviewModal({ hire, freelancerName, onCancel, onSubmit, submitting }: {
  hire: HireRequest;
  freelancerName: string;
  onCancel: () => void;
  onSubmit: (hireId: string, stars: number, text: string) => void;
  submitting: boolean;
}) {
  const [stars,   setStars]   = useState(0);
  const [hovered, setHovered] = useState(0);
  const [text,    setText]    = useState("");

  const active = hovered || stars;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d0d1a] border border-white/15 rounded-2xl p-6 max-w-md w-full shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-2xl flex-shrink-0">⭐</div>
          <div>
            <h2 className="text-base font-bold text-white">Leave a Review</h2>
            <p className="text-xs text-gray-400 mt-0.5">Rate your experience with {freelancerName}</p>
          </div>
        </div>

        {/* Star Picker */}
        <div className="mb-5">
          <p className="text-xs text-gray-400 font-semibold mb-3 uppercase tracking-wide">Your Rating *</p>
          <div className="flex gap-2 items-center">
            {[1, 2, 3, 4, 5].map(i => (
              <button
                key={i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setStars(i)}
                className="transition-transform hover:scale-125 focus:outline-none"
              >
                <svg
                  className={`w-9 h-9 transition-colors duration-100 ${i <= active ? "text-yellow-400" : "text-white/15"}`}
                  fill="currentColor" viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              </button>
            ))}
            {stars > 0 && (
              <span className="ml-2 text-sm font-bold text-yellow-400">
                {["","Poor","Fair","Good","Great","Excellent!"][stars]}
              </span>
            )}
          </div>
        </div>

        {/* Text */}
        <div className="mb-5">
          <label className="text-xs text-gray-400 font-semibold mb-1.5 block uppercase tracking-wide">
            Your Review <span className="text-gray-600 normal-case font-normal">(optional)</span>
          </label>
          <textarea
            rows={4}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={`Share your experience working with ${freelancerName}…`}
            className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none transition-all resize-none"
          />
          <p className="text-xs text-gray-600 mt-1 text-right">{text.length}/500</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-xl font-semibold text-sm transition-all text-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={() => stars > 0 && onSubmit(hire.id, stars, text)}
            disabled={stars === 0 || submitting}
            className="flex-2 flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90 disabled:opacity-40 py-3 rounded-xl font-bold text-sm transition-all text-white flex items-center justify-center gap-2"
          >
            {submitting ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Submitting…</>
            ) : (
              <>⭐ Submit Review</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="bg-[#0d0d1a] border border-white/10 rounded-2xl overflow-hidden animate-pulse">
      <div className="h-1.5 bg-white/10"/>
      <div className="p-5 space-y-3">
        <div className="flex gap-3"><div className="w-14 h-14 rounded-2xl bg-white/10 flex-shrink-0"/><div className="flex-1 space-y-2 pt-1"><div className="h-3 bg-white/10 rounded w-3/5"/><div className="h-2.5 bg-white/8 rounded w-2/5"/></div></div>
        <div className="h-2 bg-white/8 rounded"/><div className="h-2 bg-white/8 rounded w-4/5"/>
        <div className="flex gap-2"><div className="h-5 w-14 bg-white/8 rounded-full"/><div className="h-5 w-16 bg-white/8 rounded-full"/></div>
        <div className="flex justify-between pt-2 border-t border-white/8"><div className="h-4 w-20 bg-white/10 rounded"/><div className="h-7 w-16 bg-white/10 rounded-lg"/></div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MarketplacePage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [token,        setToken]        = useState("");
  const isFreelancer = useIsFreelancer(firebaseUser?.uid);
  const [userName,     setUserName]     = useState("User");
  const [userInitial,  setUserInitial]  = useState("U");
  const [userPhoto,    setUserPhoto]    = useState("");
  const [userPlan,     setUserPlan]     = useState("Free Plan");
  const [sidebarOpen,  setSidebarOpen]  = useState(true);

  const [freelancers,  setFreelancers]  = useState<FreelancerProfile[]>([]);
  const [myHires,      setMyHires]      = useState<HireRequest[]>([]);
  const [payments,     setPayments]     = useState<Payment[]>([]);
  const [loading,      setLoading]      = useState(true);
  // Auto-switch to My Hires tab if ?tab=hires is in the URL (e.g. from notification link)
  const [activeTab,    setActiveTab]    = useState<"browse"|"my-hires">(
    searchParams.get("tab") === "hires" ? "my-hires" : "browse"
  );
  const [category,     setCategory]     = useState("all");
  const [search,       setSearch]       = useState("");

  const [viewTarget,   setViewTarget]   = useState<FreelancerProfile|null>(null);
  const [hireTarget,   setHireTarget]   = useState<FreelancerProfile|null>(null);
  const [payTarget,    setPayTarget]    = useState<HireRequest|null>(null);
  const [reviewTarget, setReviewTarget] = useState<HireRequest|null>(null);
  const [reviewedIds,  setReviewedIds]  = useState<Set<string>>(new Set());
  const [submittingReview, setSubmittingReview] = useState(false);
  const [sending,      setSending]      = useState(false);
  const [msgLoading,   setMsgLoading]   = useState(false);
  const [toast,        setToast]        = useState<{msg:string;ok:boolean}|null>(null);

  const showToast = (msg:string,ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3500); };

  // ── Auth ──
  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async user=>{
      if (!user){ router.push("/login"); return; }
      setFirebaseUser(user);
      getIdToken(user).then(t => setToken(t)).catch(() => {});
      try {
        const snap = await getDoc(doc(db,"users",user.uid));
        if (snap.exists()){
          const d = snap.data();
          const name = d.fullName||user.displayName||"User";
          setUserName(name); setUserInitial(name.charAt(0).toUpperCase());
          setUserPhoto(d.profilePhoto||user.photoURL||"");
          setUserPlan(d.plan==="pro"?"Pro Plan":d.plan==="business"?"Business Plan":"Free Plan");
        } else {
          const name = user.displayName||"User";
          setUserName(name); setUserInitial(name.charAt(0).toUpperCase());
          setUserPhoto(user.photoURL||"");
        }
      } catch {}
    });
    return ()=>unsub();
  },[router]);

  // ── Real-time freelancers (ALL — no profileComplete filter) ──
  useEffect(()=>{
    if (!firebaseUser) return;
    setLoading(true);
    const unsub = onSnapshot(collection(db,"freelancer_profiles"), snap=>{
      const list = snap.docs
        .map(d=>{
          const data = d.data();
          const fullName = data.fullName||data.displayName||"";
          const rate     = data.rate||(data.hourlyRate?`LKR ${data.hourlyRate}/hr`:"");
          return {
            uid: d.id, fullName, rate,
            category:        data.category||"",
            bio:             data.bio||"",
            skills:          data.skills||[],
            location:        data.location||"",
            profilePhoto:    data.profilePhoto||"",
            verified:        data.verified||false,
            rating:          data.rating||0,
            reviewCount:     data.reviewCount||data.totalReviews||0,
            completedOrders: data.completedOrders||0,
            activeProjects:  data.activeProjects||0,
            available:       data.available!==undefined ? data.available : true,
            profileComplete: !!(data.category&&data.bio&&fullName),
          } as FreelancerProfile;
        })
        .filter(p => p.uid !== firebaseUser.uid)   // exclude own profile
        .sort((a,b)=>{
          // Complete profiles first, then by rating
          if (a.profileComplete && !b.profileComplete) return -1;
          if (!a.profileComplete && b.profileComplete) return 1;
          return (b.rating||0)-(a.rating||0);
        });
      setFreelancers(list);
      setLoading(false);
    });
    return ()=>unsub();
  },[firebaseUser]);

  // ── Real-time hire requests ──
  useEffect(()=>{
    if (!firebaseUser) return;
    const q = query(collection(db,"hire_requests"), where("clientUid","==",firebaseUser.uid));
    const unsub = onSnapshot(q, snap=>{
      const sorted = snap.docs.map(d=>({id:d.id,...d.data()}) as HireRequest)
        .sort((a,b)=>{
          const ta=a.createdAt?.toDate?.()?.getTime()||0;
          const tb=b.createdAt?.toDate?.()?.getTime()||0;
          return tb-ta;
        });
      setMyHires(sorted);
    });
    return ()=>unsub();
  },[firebaseUser]);

  // ── Real-time payments ──
  useEffect(()=>{
    if (!firebaseUser) return;
    const q = query(collection(db,"payments"), where("clientUid","==",firebaseUser.uid));
    const unsub = onSnapshot(q, snap=>{
      setPayments(snap.docs.map(d=>({id:d.id,...d.data()}) as Payment));
    });
    return ()=>unsub();
  },[firebaseUser]);

  // ── Load which hire requests this client already reviewed (via API — no Firestore rules needed) ──
  useEffect(()=>{
    if (!firebaseUser) return;
    getIdToken(firebaseUser).then(async tok => {
      try {
        const res  = await fetch(`${API}/reviews/my-reviews`, { headers: { Authorization: `Bearer ${tok}` } });
        const data = await res.json();
        if (data.success) {
          setReviewedIds(new Set((data.reviews as any[]).map(r => r.hireRequestId).filter(Boolean)));
        }
      } catch { /* non-critical */ }
    }).catch(()=>{});
  },[firebaseUser]);

  // ── Message ──
  const handleMessage = async (f:FreelancerProfile)=>{
    if (!firebaseUser) return;
    setMsgLoading(true);
    try {
      const q = query(collection(db,"conversations"),
        where("clientUid","==",firebaseUser.uid), where("freelancerUid","==",f.uid));
      const ex = await getDocs(q);
      if (!ex.empty){ router.push(`/dashboard/messages?conv=${ex.docs[0].id}`); return; }

      // Fetch the current user's name fresh from Firestore to avoid stale state
      const userSnap = await getDoc(doc(db,"users",firebaseUser.uid));
      const freshName  = userSnap.exists() ? (userSnap.data().fullName  || firebaseUser.displayName || "Client") : (firebaseUser.displayName || "Client");
      const freshPhoto = userSnap.exists() ? (userSnap.data().profilePhoto || firebaseUser.photoURL || "") : (firebaseUser.photoURL || "");

      const ref = await addDoc(collection(db,"conversations"),{
        clientUid:firebaseUser.uid, clientName:freshName, clientPhoto:freshPhoto,
        freelancerUid:f.uid, freelancerName:f.fullName, freelancerPhoto:f.profilePhoto||"",
        lastMessage:"", lastMessageAt:serverTimestamp(), lastSenderUid:"",
        unreadClient:0, unreadFreelancer:0, createdAt:serverTimestamp(),
      });
      router.push(`/dashboard/messages?conv=${ref.id}`);
    } catch(e){ showToast("Could not open conversation.",false); }
    finally { setMsgLoading(false); }
  };

  // ── Hire ──
  const handleHire = async (desc:string, budget:string)=>{
    if (!hireTarget||!firebaseUser) return;
    setSending(true);
    try {
      const token = await getIdToken(firebaseUser);
      const res = await fetch(`${API}/marketplace/hire`,{
        method:"POST",
        headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},
        body:JSON.stringify({ freelancerUid:hireTarget.uid, freelancerName:hireTarget.fullName, projectDescription:desc, budget }),
      });
      const data = await res.json();
      if (data.success){ showToast(`✅ Hire request sent to ${hireTarget.fullName}!`); setHireTarget(null); }
      else showToast(data.message||"Failed to send request",false);
    } catch { showToast("Failed to send request",false); }
    finally { setSending(false); }
  };

  // ── Submit Review ──
  const handleSubmitReview = async (hireId: string, stars: number, text: string) => {
    if (!firebaseUser) return;
    setSubmittingReview(true);
    try {
      const tok = await getIdToken(firebaseUser);
      const res = await fetch(`${API}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
        body: JSON.stringify({ hireRequestId: hireId, stars, text }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`⭐ Review submitted! New rating: ${data.rating}`);
        setReviewedIds(prev => new Set([...prev, hireId]));
        setReviewTarget(null);
      } else {
        showToast(data.message || "Failed to submit review", false);
      }
    } catch {
      showToast("Failed to submit review", false);
    } finally {
      setSubmittingReview(false);
    }
  };

  const pendingUids = new Set(myHires.filter(h=>h.status==="pending").map(h=>h.freelancerUid));
  const paidIds     = new Set(payments.map(p=>p.hireRequestId));

  const filtered = freelancers.filter(f=>{
    const mc = category==="all"||(f.category||"").toLowerCase()===category;
    const ms = !search||f.fullName.toLowerCase().includes(search.toLowerCase())
      ||(f.category||"").toLowerCase().includes(search.toLowerCase())
      ||(f.bio||"").toLowerCase().includes(search.toLowerCase())
      ||(f.skills||[]).some(s=>s.toLowerCase().includes(search.toLowerCase()));
    return mc&&ms;
  });

  const totalSkills = new Set(freelancers.flatMap(f=>f.skills||[])).size;
  const avgRating   = freelancers.filter(f=>f.rating>0).length
    ? (freelancers.filter(f=>f.rating>0).reduce((s,f)=>s+f.rating,0)/freelancers.filter(f=>f.rating>0).length).toFixed(1)
    : "—";

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white flex">

      {/* Modals */}
      {viewTarget && (
        <FreelancerModal f={viewTarget} onClose={()=>setViewTarget(null)}
          onHire={f=>{setViewTarget(null);setHireTarget(f);}}
          onMessage={f=>{setViewTarget(null);handleMessage(f);}}
          alreadyHired={pendingUids.has(viewTarget.uid)}/>
      )}
      {hireTarget && (
        <HireModal f={hireTarget} onCancel={()=>setHireTarget(null)}
          onConfirm={handleHire} sending={sending}/>
      )}
      {payTarget && (
        <StripePaymentModal
          hire={payTarget}
          token={token}
          onClose={() => setPayTarget(null)}
          onSuccess={() => {
            showToast("✅ Payment successful! Funds held in escrow.");
            // myHires auto-refreshes via onSnapshot
          }}
        />
      )}
      {reviewTarget && (
        <ReviewModal
          hire={reviewTarget}
          freelancerName={reviewTarget.freelancerName || "the freelancer"}
          onCancel={() => setReviewTarget(null)}
          onSubmit={handleSubmitReview}
          submitting={submittingReview}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[60] flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-semibold ${toast.ok?"bg-green-600":"bg-red-600"}`}>
          {toast.ok?"✅":"❌"} {toast.msg}
        </div>
      )}
      {msgLoading && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-[#0d0d1a] border border-white/15 rounded-2xl px-8 py-6 text-sm text-gray-300">Opening conversation…</div>
        </div>
      )}

      <Sidebar sidebarOpen={sidebarOpen} activeLink="Marketplace" setActiveLink={()=>{}}
        userName={userName} userInitial={userInitial} userPhoto={userPhoto} userPlan={userPlan} isFreelancer={isFreelancer}/>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onToggleSidebar={()=>setSidebarOpen(o=>!o)}
          userName={userName} userInitial={userInitial} userPhoto={userPhoto}/>

        <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-extrabold">👥 Freelancer Marketplace</h1>
              <p className="text-sm text-gray-400 mt-1">
                {loading?"Loading live profiles…":<>
                  <span className="text-white font-semibold">{freelancers.length}</span> freelancer{freelancers.length!==1?"s":""} registered
                  <span className="ml-2 text-green-400 text-xs">● Live</span>
                </>}
              </p>
            </div>
            <button onClick={()=>setActiveTab(t=>t==="browse"?"my-hires":"browse")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${activeTab==="my-hires"?"bg-violet-600 border-violet-500 text-white":"bg-white/5 border-white/10 text-gray-300 hover:border-violet-500/40"}`}>
              📋 My Hire Requests
              {myHires.filter(h=>h.status==="accepted"&&!(paidIds.has(h.id)||h.paid)).length>0&&(
                <span className="flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                  💳 Pay Now
                </span>
              )}
              {myHires.filter(h=>h.status==="pending").length>0&&(
                <span className="w-5 h-5 bg-yellow-400 text-black text-xs font-bold rounded-full flex items-center justify-center">
                  {myHires.filter(h=>h.status==="pending").length}
                </span>
              )}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon:"👥", label:"Total Freelancers",  val:loading?"…":freelancers.length,             color:"text-violet-400" },
              { icon:"✅", label:"Available Now",       val:loading?"…":freelancers.filter(f=>f.available).length, color:"text-green-400" },
              { icon:"🛠️", label:"Unique Skills",       val:loading?"…":totalSkills>0?totalSkills:"—", color:"text-blue-400"   },
              { icon:"⭐", label:"Avg Rating",          val:loading?"…":avgRating,                     color:"text-yellow-400" },
            ].map(s=>(
              <div key={s.label} className="bg-[#0d0d1a] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
                <div className="text-2xl">{s.icon}</div>
                <div><div className={`text-2xl font-extrabold ${s.color}`}>{s.val}</div><div className="text-xs text-gray-500">{s.label}</div></div>
              </div>
            ))}
          </div>

          {/* ── BROWSE ── */}
          {activeTab==="browse" && (
            <div className="space-y-5">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/></svg>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search freelancers by name, skill or category…"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-10 py-3 text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition-all"/>
                {search&&<button onClick={()=>setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-lg">×</button>}
              </div>

              <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map(c=>(
                  <button key={c.key} onClick={()=>setCategory(c.key)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${category===c.key?"bg-violet-600 border-violet-500 text-white shadow-lg":"bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-violet-500/30"}`}>
                    <span>{c.icon}</span>{c.label}
                  </button>
                ))}
              </div>

              {!loading&&<p className="text-xs text-gray-500">Showing <span className="text-white font-semibold">{filtered.length}</span> freelancer{filtered.length!==1?"s":""}{search&&<> for "<span className="text-violet-400">{search}</span>"</>} · Click any card to view full profile</p>}

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">{Array.from({length:6}).map((_,i)=><Skeleton key={i}/>)}</div>
              ) : filtered.length>0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filtered.map(f=>(
                    <FreelancerCard key={f.uid} f={f}
                      alreadyHired={pendingUids.has(f.uid)}
                      onHire={setHireTarget} onMessage={handleMessage} onView={setViewTarget}/>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 rounded-full bg-violet-500/15 flex items-center justify-center text-4xl mb-5">{search||category!=="all"?"🔍":"👥"}</div>
                  <h3 className="text-lg font-bold text-white mb-2">{search||category!=="all"?"No matches found":"No freelancers yet"}</h3>
                  <p className="text-sm text-gray-500 max-w-sm">{search||category!=="all"?"Try different keywords or browse all.":"Freelancers who register appear here automatically."}</p>
                  {(search||category!=="all")&&<button onClick={()=>{setSearch("");setCategory("all");}} className="mt-4 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-semibold transition-all">Clear Filters</button>}
                </div>
              )}
            </div>
          )}

          {/* ── MY HIRES ── */}
          {activeTab==="my-hires" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div><h2 className="font-bold text-white">Your Hire Requests</h2><p className="text-xs text-gray-500 mt-0.5">Updates in real-time <span className="text-green-400">● Live</span></p></div>
              </div>

              {/* ── Action required banner ── */}
              {myHires.some(h=>h.status==="accepted"&&!(paidIds.has(h.id)||h.paid)) && (
                <div className="bg-gradient-to-r from-green-500/15 to-emerald-500/10 border border-green-500/30 rounded-2xl px-5 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-500/25 border border-green-500/40 flex items-center justify-center text-xl flex-shrink-0">🎉</div>
                  <div className="flex-1">
                    <p className="font-bold text-green-400 text-sm">Action required — Payment pending</p>
                    <p className="text-xs text-gray-400 mt-0.5">A freelancer accepted your request. Scroll down to complete payment and start your project.</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-ping flex-shrink-0"/>
                </div>
              )}

              {myHires.length===0 ? (
                <div className="bg-[#0d0d1a] border border-white/10 rounded-2xl p-14 flex flex-col items-center text-center gap-3">
                  <div className="text-5xl">📋</div>
                  <h3 className="font-bold text-gray-300">No hire requests yet</h3>
                  <p className="text-sm text-gray-500">Browse freelancers and send a hire request</p>
                  <button onClick={()=>setActiveTab("browse")} className="mt-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-semibold transition-all">Browse Freelancers</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myHires.map(h=>{
                    const fl    = freelancers.find(f=>f.uid===h.freelancerUid);
                    const grad  = gradFor(h.freelancerUid);
                    const paid  = paidIds.has(h.id) || h.paid;
                    return (
                      <div key={h.id} className={`bg-[#0d0d1a] border rounded-2xl p-5 transition-all ${
                        h.status==="accepted"&&!paid
                          ? "border-green-500/30 hover:border-green-500/50 shadow-lg shadow-green-500/5"
                          : "border-white/10 hover:border-white/20"
                      }`}>
                        <div className="flex items-start gap-4">
                          {fl?.profilePhoto
                            ? <img src={fl.profilePhoto} className="w-12 h-12 rounded-xl object-cover flex-shrink-0"/>
                            : <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center font-bold text-lg text-white flex-shrink-0`}>{h.freelancerName?.charAt(0)||"F"}</div>
                          }
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-bold text-sm text-white">{h.freelancerName}</span>
                              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${statusStyle[h.status]}`}>{statusIcon[h.status]} {h.status.charAt(0).toUpperCase()+h.status.slice(1)}</span>
                              {paid && <span className="text-xs bg-green-500/15 border border-green-500/30 text-green-400 px-2 py-0.5 rounded-full font-semibold">💰 Paid</span>}
                            </div>
                            <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{h.projectDescription}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                              {h.budget && <span>💰 {h.budget}</span>}
                              <span>🕐 {h.createdAt?.toDate ? h.createdAt.toDate().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : h.createdAt ? new Date(h.createdAt).toLocaleDateString("en-US",{month:"short",day:"numeric"}) : ""}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            {(h.status==="accepted"||h.status==="completed") && (
                              <button onClick={()=>router.push("/dashboard/messages")}
                                className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 px-3 py-1.5 rounded-lg font-semibold transition-all">
                                💬 Chat
                              </button>
                            )}
                          </div>
                        </div>

                        {/* ── Pay Now banner — shown when accepted & unpaid ── */}
                        {h.status==="accepted" && !paid && (
                          <div className="mt-4 bg-gradient-to-r from-green-500/10 to-emerald-500/5 border border-green-500/25 rounded-xl p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center justify-center text-xl">✅</div>
                              <div>
                                <p className="text-sm font-bold text-green-400">Request Accepted!</p>
                                <p className="text-xs text-gray-400 mt-0.5">{h.freelancerName} accepted your project. Complete payment to start.</p>
                              </div>
                            </div>
                            <button onClick={()=>setPayTarget(h)}
                              className="flex-shrink-0 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 active:scale-95 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-green-500/25 flex items-center gap-2">
                              💳 Pay Now
                            </button>
                          </div>
                        )}

                        {/* ── Paid / Escrow confirmation ── */}
                        {paid && h.status !== "completed" && (
                          <div className="mt-4 bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">🔒</span>
                              <div>
                                <p className="text-xs font-bold text-blue-300">Payment in Escrow</p>
                                <p className="text-xs text-gray-400 mt-0.5">Funds are held securely. Release them when {h.freelancerName} completes the work.</p>
                              </div>
                            </div>
                            <button
                              onClick={async () => {
                                if (!confirm(`Approve work and release payment to ${h.freelancerName}?`)) return;
                                // Prefer the escrowed payment — stale "pending" docs from
                                // abandoned modal sessions are ignored automatically.
                                const payRec =
                                  payments.find(p => p.hireRequestId === h.id && p.status === "escrowed") ||
                                  payments.find(p => p.hireRequestId === h.id);
                                if (!payRec) { showToast("Payment record not found", false); return; }
                                try {
                                  const res = await fetch(`${API}/payments/release/${payRec.id}`, {
                                    method: "POST",
                                    headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
                                    body: JSON.stringify({ note: "Client approved work" }),
                                  });
                                  const data = await res.json();
                                  if (!res.ok) throw new Error(data.message);
                                  showToast("✅ Payment released to freelancer!");
                                } catch(e:any) { showToast(e.message||"Failed to release",false); }
                              }}
                              className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl font-bold text-xs transition-all">
                              ✅ Approve &amp; Release
                            </button>
                          </div>
                        )}
                        {h.status === "completed" && (
                          <div className="mt-4 bg-green-500/5 border border-green-500/20 rounded-xl p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">🎉</span>
                              <p className="text-xs text-green-300">
                                Work approved! Payment released to {h.freelancerName}. Project complete.
                              </p>
                            </div>
                            {reviewedIds.has(h.id) ? (
                              <span className="flex-shrink-0 text-xs bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap">
                                ⭐ Reviewed
                              </span>
                            ) : (
                              <button
                                onClick={() => setReviewTarget(h)}
                                className="flex-shrink-0 bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90 active:scale-95 text-white px-4 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap"
                              >
                                ⭐ Leave a Review
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Payment history */}
              {payments.length>0&&(
                <div className="mt-6">
                  <h3 className="font-bold text-white mb-3 flex items-center gap-2">💰 Payment History <span className="text-xs text-gray-500 font-normal">({payments.length} payments)</span></h3>
                  <div className="space-y-2">
                    {payments.map(p=>(
                      <div key={p.id} className="bg-[#0d0d1a] border border-white/10 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center text-lg">💰</div>
                          <div>
                            <p className="text-sm font-semibold text-white">{p.freelancerName}</p>
                            <p className="text-xs text-gray-500">{p.method} · {p.createdAt?.toDate?p.createdAt.toDate().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):""}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-400">{p.amount}</p>
                          <span className="text-xs bg-green-500/15 border border-green-500/30 text-green-400 px-2 py-0.5 rounded-full">✅ Sent</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
