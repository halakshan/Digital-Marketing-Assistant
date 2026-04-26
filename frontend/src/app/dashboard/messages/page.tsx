"use client";

import { Suspense } from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, onSnapshot,
  query, where, serverTimestamp,
} from "firebase/firestore";
import {
  ref as storageRef, uploadBytesResumable, getDownloadURL,
} from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";
import { useIsFreelancer } from "@/hooks/useIsFreelancer";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar  from "@/components/dashboard/Topbar";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Attachment { type: "image" | "file"; url: string; name: string; size: number; }
interface Message {
  id: string;
  conversationId: string;
  senderUid: string;
  senderName: string;
  senderPhoto: string;
  text: string;
  attachments: Attachment[];
  createdAt: any;
}
interface Conversation {
  id: string;
  clientUid: string; clientName: string; clientPhoto: string;
  freelancerUid: string; freelancerName: string; freelancerPhoto: string;
  lastMessage: string; lastMessageAt: any; lastSenderUid: string;
  unreadClient: number; unreadFreelancer: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(date: any): string {
  if (!date) return "";
  const d  = date?.toDate ? date.toDate() : new Date(date);
  const s  = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60)    return "Just now";
  if (s < 3600)  return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return d.toLocaleDateString("en-US", { month:"short", day:"numeric" });
}
function fmtTime(date: any): string {
  if (!date) return "";
  const d = date?.toDate ? date.toDate() : new Date(date);
  return d.toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" });
}
function fmtDate(date: any): string {
  if (!date) return "";
  const d = date?.toDate ? date.toDate() : new Date(date);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const yest = new Date(now); yest.setDate(yest.getDate()-1);
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday:"long", month:"short", day:"numeric" });
}
function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/1048576).toFixed(1)} MB`;
}
function getInitial(name: string) { return (name||"?").charAt(0).toUpperCase(); }

// ── Avatar ─────────────────────────────────────────────────────────────────────
function Avatar({ photo, name, size=36 }: { photo?:string; name:string; size?:number }) {
  const colors = ["from-violet-500 to-indigo-600","from-pink-500 to-rose-600","from-blue-500 to-cyan-600","from-amber-500 to-orange-600"];
  const c = colors[(name.charCodeAt(0)||0)%colors.length];
  if (photo) return <img src={photo} alt={name} style={{width:size,height:size}} className="rounded-full object-cover flex-shrink-0"/>;
  return (
    <div className={`rounded-full bg-gradient-to-br ${c} flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{width:size,height:size,fontSize:size*0.4}}>
      {getInitial(name)}
    </div>
  );
}

// ── File/Image uploader ────────────────────────────────────────────────────────
async function uploadAttachment(file: File, convId: string): Promise<Attachment> {
  const ext = file.name.split(".").pop();
  const path = `chat-attachments/${convId}/${Date.now()}_${file.name}`;
  const sRef = storageRef(storage, path);
  await new Promise<void>((resolve, reject) => {
    const task = uploadBytesResumable(sRef, file);
    task.on("state_changed", null, reject, () => resolve());
  });
  const url = await getDownloadURL(sRef);
  const type = file.type.startsWith("image/") ? "image" : "file";
  return { type, url, name: file.name, size: file.size };
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"/>
      </div>
    }>
      <MessagesInner />
    </Suspense>
  );
}

function MessagesInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const initConvId   = searchParams.get("conv") || "";

  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const isFreelancer = useIsFreelancer(firebaseUser?.uid);
  const [userName,     setUserName]     = useState("User");
  const [userPhoto,    setUserPhoto]    = useState("");
  const [userInitial,  setUserInitial]  = useState("U");
  const [userPlan,     setUserPlan]     = useState("Free Plan");
  const [sidebarOpen,  setSidebarOpen]  = useState(true);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId,  setActiveConvId]  = useState(initConvId);
  const [messages,      setMessages]      = useState<Message[]>([]);
  const [text,          setText]          = useState("");
  const [search,        setSearch]        = useState("");
  const [uploading,     setUploading]     = useState(false);
  const [uploadPct,     setUploadPct]     = useState(0);
  const [pendingFiles,  setPendingFiles]  = useState<File[]>([]);
  const [sending,       setSending]       = useState(false);
  const [loading,       setLoading]       = useState(true);

  const endRef     = useRef<HTMLDivElement>(null);
  const fileRef    = useRef<HTMLInputElement>(null);
  const textRef    = useRef<HTMLTextAreaElement>(null);

  // ── Sync active conversation when URL ?conv= param changes ──
  useEffect(() => {
    if (initConvId) setActiveConvId(initConvId);
  }, [initConvId]);

  // ── Auth ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) { router.push("/login"); return; }
      setFirebaseUser(user);
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const d = snap.data();
          const name = d.fullName || user.displayName || "User";
          setUserName(name); setUserInitial(name.charAt(0).toUpperCase());
          setUserPhoto(d.profilePhoto || user.photoURL || "");
          setUserPlan(d.plan === "pro" ? "Pro Plan" : d.plan === "business" ? "Business Plan" : "Free Plan");
        }
      } catch {}
    });
    return () => unsub();
  }, [router]);

  // ── Self-repair: fix any conversation docs where our name is wrong ──
  useEffect(() => {
    if (!firebaseUser || !userName || userName === "User") return;
    const uid = firebaseUser.uid;
    // Find all conversations where we are the client and patch the name if stale
    getDocs(query(collection(db, "conversations"), where("clientUid", "==", uid)))
      .then(snap => {
        snap.docs.forEach(d => {
          const data = d.data() as Conversation;
          if (data.clientName !== userName || data.clientPhoto !== userPhoto) {
            updateDoc(doc(db, "conversations", d.id), {
              clientName:  userName,
              clientPhoto: userPhoto,
            }).catch(() => {});
          }
        });
      })
      .catch(() => {});
  }, [firebaseUser, userName, userPhoto]);

  // ── Load conversations (real-time) — two independent listeners merged ──
  useEffect(() => {
    if (!firebaseUser) return;
    const uid  = firebaseUser.uid;
    const seen = new Map<string, Conversation>();

    const merge = () => {
      const sorted = [...seen.values()].sort((a, b) => {
        const ta = a.lastMessageAt?.toMillis?.() ?? (a.lastMessageAt?.seconds ? a.lastMessageAt.seconds * 1000 : 0);
        const tb = b.lastMessageAt?.toMillis?.() ?? (b.lastMessageAt?.seconds ? b.lastMessageAt.seconds * 1000 : 0);
        return tb - ta;
      });

      // Deduplicate by other person's UID — keep only the most recent conversation per person
      const deduped: Conversation[] = [];
      const seenOther = new Set<string>();
      for (const conv of sorted) {
        const otherUid = conv.clientUid === uid ? conv.freelancerUid : conv.clientUid;
        if (!seenOther.has(otherUid)) {
          seenOther.add(otherUid);
          deduped.push(conv);
        }
      }

      setConversations(deduped);
      setLoading(false);
      setActiveConvId(prev => prev || (deduped.length ? deduped[0].id : ""));
    };

    const q1 = query(collection(db, "conversations"), where("clientUid",     "==", uid));
    const q2 = query(collection(db, "conversations"), where("freelancerUid", "==", uid));

    const unsub1 = onSnapshot(q1, snap => {
      snap.docs.forEach(d => seen.set(d.id, { id: d.id, ...d.data() } as Conversation));
      merge();
    }, err => { if (err.code !== "permission-denied") console.error("Conv q1:", err); });

    const unsub2 = onSnapshot(q2, snap => {
      snap.docs.forEach(d => seen.set(d.id, { id: d.id, ...d.data() } as Conversation));
      merge();
    }, err => { if (err.code !== "permission-denied") console.error("Conv q2:", err); });

    return () => { unsub1(); unsub2(); };
  }, [firebaseUser]);

  // ── Load messages (real-time) — no orderBy to avoid needing a composite index ──
  useEffect(() => {
    if (!activeConvId) return;
    setMessages([]);
    // No orderBy — sort client-side so no Firestore composite index is needed
    const q = query(
      collection(db, "messages"),
      where("conversationId", "==", activeConvId)
    );
    const unsub = onSnapshot(q, snap => {
      const msgs = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Message))
        .sort((a, b) => {
          // toMillis() handles Firestore Timestamps; fall back to 0 for null (pending serverTimestamp)
          const ta = a.createdAt?.toMillis?.() ?? (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
          const tb = b.createdAt?.toMillis?.() ?? (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
          return ta - tb;
        });
      setMessages(msgs);
      if (firebaseUser) markRead(activeConvId, firebaseUser.uid);
    }, err => { if (err.code !== "permission-denied") console.error("Messages:", err); });
    return () => unsub();
  }, [activeConvId, firebaseUser]);

  // ── Auto-scroll ──
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages]);

  // ── Mark as read — fetch conv directly so it works even before list loads ──
  const markRead = async (convId: string, uid: string) => {
    try {
      const convSnap = await getDoc(doc(db, "conversations", convId));
      if (!convSnap.exists()) return;
      const conv = convSnap.data() as Conversation;
      const isClient = conv.clientUid === uid;
      if (isClient && (conv.unreadClient || 0) > 0)
        await updateDoc(doc(db, "conversations", convId), { unreadClient: 0 });
      else if (!isClient && (conv.unreadFreelancer || 0) > 0)
        await updateDoc(doc(db, "conversations", convId), { unreadFreelancer: 0 });
    } catch {}
  };

  // ── Send message ──
  const handleSend = async () => {
    if (!firebaseUser || !activeConvId) return;
    if (!text.trim() && pendingFiles.length === 0) return;
    setSending(true);
    try {
      // Upload attachments first
      const attachments: Attachment[] = [];
      for (const file of pendingFiles) {
        setUploading(true);
        const att = await uploadAttachment(file, activeConvId);
        attachments.push(att);
      }
      setUploading(false); setPendingFiles([]);

      const conv   = conversations.find(c=>c.id===activeConvId);
      const isClient = conv?.clientUid === firebaseUser.uid;
      const preview = text.trim() || (attachments.length ? `📎 ${attachments[0].name}` : "");

      const receiverUid = isClient ? conv?.freelancerUid : conv?.clientUid;
      await addDoc(collection(db,"messages"), {
        conversationId: activeConvId,
        senderUid:   firebaseUser.uid,
        senderName:  userName,
        senderPhoto: userPhoto,
        receiverUid: receiverUid || "",
        text:        text.trim(),
        attachments,
        createdAt:   serverTimestamp(),
      });

      await updateDoc(doc(db,"conversations",activeConvId), {
        lastMessage:   preview,
        lastMessageAt: serverTimestamp(),
        lastSenderUid: firebaseUser.uid,
        // Keep the sender's display name & photo fresh in the conversation doc
        ...(isClient
          ? { unreadFreelancer: (conv?.unreadFreelancer||0) + 1, clientName: userName, clientPhoto: userPhoto }
          : { unreadClient:    (conv?.unreadClient||0)     + 1, freelancerName: userName, freelancerPhoto: userPhoto }),
      });

      // Create notification for the recipient
      const recipientUid = isClient ? conv?.freelancerUid : conv?.clientUid;
      if (recipientUid) {
        await addDoc(collection(db,"notifications"), {
          userId:    recipientUid,
          type:      "message",
          title:     `New message from ${userName}`,
          body:      preview.slice(0,100),
          read:      false,
          actionUrl: isClient ? "/freelancer/messages" : "/dashboard/messages",
          createdAt: serverTimestamp(),
        });
      }

      setText(""); textRef.current?.focus();
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files||[]);
    setPendingFiles(prev => [...prev, ...files]);
    e.target.value = "";
  };

  // ── Active conversation info ──
  const activeConv = conversations.find(c=>c.id===activeConvId);
  const otherName  = activeConv
    ? (activeConv.clientUid === firebaseUser?.uid ? activeConv.freelancerName : activeConv.clientName)
    : "";
  const otherPhoto = activeConv
    ? (activeConv.clientUid === firebaseUser?.uid ? activeConv.freelancerPhoto : activeConv.clientPhoto)
    : "";

  // ── Filter conversations ──
  const filteredConvs = conversations.filter(c => {
    const name = c.clientUid === firebaseUser?.uid ? c.freelancerName : c.clientName;
    return name.toLowerCase().includes(search.toLowerCase());
  });

  // ── Date separator logic ──
  const needsDateSep = (msgs: Message[], idx: number) => {
    if (idx === 0) return true;
    if (!msgs[idx-1].createdAt || !msgs[idx].createdAt) return false;
    const prev = msgs[idx-1].createdAt?.toDate?.() ?? new Date(msgs[idx-1].createdAt);
    const curr = msgs[idx].createdAt?.toDate?.()   ?? new Date(msgs[idx].createdAt);
    return prev.toDateString() !== curr.toDateString();
  };

  return (
    <div className="flex h-screen bg-[#0a0a14] overflow-hidden">
      <Sidebar
        sidebarOpen={sidebarOpen}
        activeLink="Messages"
        setActiveLink={() => {}}
        userName={userName} userInitial={userInitial} userPhoto={userPhoto} userPlan={userPlan}
        isFreelancer={isFreelancer}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          userName={userName} userInitial={userInitial} userPhoto={userPhoto}
        />

        <div className="flex flex-1 min-h-0">
          {/* ── Conversation List ── */}
          <div className="w-80 flex-shrink-0 border-r border-white/10 flex flex-col bg-[#0d0d1a]">
            {/* Header */}
            <div className="p-4 border-b border-white/10">
              <h2 className="text-base font-bold text-white mb-3">Inbox</h2>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
                </svg>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search conversations…"
                  className="bg-transparent text-sm text-white placeholder-gray-500 outline-none flex-1"/>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {loading && (
                <div className="p-6 text-center text-gray-500 text-sm">Loading…</div>
              )}
              {!loading && filteredConvs.length === 0 && (
                <div className="p-6 text-center">
                  <div className="text-4xl mb-3">💬</div>
                  <p className="text-gray-400 text-sm font-medium">No conversations yet</p>
                  <p className="text-gray-600 text-xs mt-1">Message a freelancer from the Marketplace</p>
                </div>
              )}
              {filteredConvs.map(conv => {
                const isActive  = conv.id === activeConvId;
                const isClient  = conv.clientUid === firebaseUser?.uid;
                const name      = isClient ? conv.freelancerName : conv.clientName;
                const photo     = isClient ? conv.freelancerPhoto : conv.clientPhoto;
                const unread    = isClient ? conv.unreadClient : conv.unreadFreelancer;
                return (
                  <button key={conv.id} onClick={() => setActiveConvId(conv.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-b border-white/5 ${isActive ? "bg-violet-500/15 border-l-2 border-l-violet-500" : "hover:bg-white/5"}`}>
                    <div className="relative flex-shrink-0">
                      {photo
                        ? <img src={photo} className="w-10 h-10 rounded-full object-cover"/>
                        : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-bold text-sm text-white">{getInitial(name)}</div>
                      }
                      {unread > 0 && (
                        <span className="absolute -top-1 -right-1 bg-violet-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{unread}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-semibold truncate ${isActive?"text-white":"text-gray-200"}`}>{name}</span>
                        <span className="text-[10px] text-gray-500 flex-shrink-0 ml-2">{timeAgo(conv.lastMessageAt)}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage || "Start the conversation…"}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Chat Window ── */}
          {activeConvId && activeConv ? (
            <div className="flex-1 flex flex-col min-w-0">
              {/* Chat Header */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/10 bg-[#0d0d1a]">
                <div className="relative">
                  {otherPhoto
                    ? <img src={otherPhoto} className="w-10 h-10 rounded-full object-cover border-2 border-violet-500/40"/>
                    : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-bold text-sm text-white border-2 border-violet-500/40">{getInitial(otherName)}</div>
                  }
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0d0d1a]"/>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white leading-tight">{otherName || "Unknown"}</p>
                  <p className="text-xs text-green-400 font-medium">
                    {activeConv.clientUid === firebaseUser?.uid ? "🎨 Freelancer" : "👤 Client"} · Online
                  </p>
                </div>
                <div className="text-xs text-gray-500 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
                  {messages.length} message{messages.length !== 1 ? "s" : ""}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto py-5 px-4 space-y-3" style={{background:"linear-gradient(180deg,#0a0a14 0%,#0d0d1a 100%)"}}>
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center pb-10">
                    <div className="w-16 h-16 rounded-full bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-3xl mb-4">👋</div>
                    <p className="text-white font-bold text-base">Say hello to {otherName}!</p>
                    <p className="text-gray-500 text-sm mt-1">This is the beginning of your conversation.</p>
                  </div>
                )}

                {messages.map((msg, idx) => {
                  const isMine  = msg.senderUid === firebaseUser?.uid;
                  const showSep = needsDateSep(messages, idx);
                  const showAvatar = !isMine && (idx === 0 || messages[idx - 1]?.senderUid !== msg.senderUid);
                  const showName   = !isMine && showAvatar;

                  return (
                    <div key={msg.id}>
                      {/* ── Date separator ── */}
                      {showSep && (
                        <div className="flex items-center gap-3 my-3">
                          <div className="flex-1 h-px bg-white/8"/>
                          <span className="text-[11px] text-gray-500 font-semibold bg-[#111] border border-white/10 px-3 py-1 rounded-full">{fmtDate(msg.createdAt)}</span>
                          <div className="flex-1 h-px bg-white/8"/>
                        </div>
                      )}

                      {/* ── Message row ── */}
                      <div className={`flex items-end gap-2.5 ${isMine ? "flex-row-reverse" : "flex-row"}`}>

                        {/* Avatar — left side for received, spacer for sent */}
                        {isMine
                          ? <div className="w-8 flex-shrink-0"/> /* spacer so sent bubble doesn't stretch full width */
                          : (showAvatar
                              ? (msg.senderPhoto
                                  ? <img src={msg.senderPhoto} className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-white/10 self-end mb-0.5"/>
                                  : <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 border border-white/10 self-end mb-0.5">
                                      {getInitial(msg.senderName)}
                                    </div>
                                )
                              : <div className="w-8 flex-shrink-0"/>  /* placeholder so bubbles stay aligned */
                            )
                        }

                        {/* Bubble column */}
                        <div className={`flex flex-col gap-1 max-w-[65%] ${isMine ? "items-end" : "items-start"}`}>

                          {/* Sender name (only for received, first in a group) */}
                          {showName && (
                            <span className="text-[11px] font-semibold text-violet-400 ml-1 mb-0.5">{msg.senderName}</span>
                          )}

                          {/* Text bubble */}
                          {msg.text && (
                            <div className={`relative px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
                              isMine
                                ? "bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-2xl rounded-br-sm"
                                : "bg-[#1e2235] text-gray-100 border border-white/10 rounded-2xl rounded-bl-sm"
                            }`}>
                              {msg.text}
                            </div>
                          )}

                          {/* Attachments */}
                          {(msg.attachments || []).map((att, ai) => (
                            <div key={ai} className="mt-0.5">
                              {att.type === "image" ? (
                                <a href={att.url} target="_blank" rel="noopener noreferrer">
                                  <img src={att.url} alt={att.name}
                                    className={`max-w-[260px] max-h-52 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity border ${isMine ? "border-violet-500/30 rounded-br-sm" : "border-white/10 rounded-bl-sm"}`}/>
                                </a>
                              ) : (
                                <a href={att.url} target="_blank" rel="noopener noreferrer"
                                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm hover:opacity-80 transition-opacity ${
                                    isMine
                                      ? "bg-violet-700/50 border-violet-500/30 text-white"
                                      : "bg-[#1e2235] border-white/10 text-gray-200"
                                  }`}>
                                  <span className="text-xl">📎</span>
                                  <div className="min-w-0">
                                    <p className="font-semibold truncate max-w-[160px]">{att.name}</p>
                                    <p className="text-xs opacity-60 mt-0.5">{fmtSize(att.size)}</p>
                                  </div>
                                  <span className="opacity-50 text-xs ml-1">↓</span>
                                </a>
                              )}
                            </div>
                          ))}

                          {/* Time + sent indicator */}
                          <div className={`flex items-center gap-1 px-1 ${isMine ? "flex-row-reverse" : ""}`}>
                            <span className="text-[10px] text-gray-600">{fmtTime(msg.createdAt)}</span>
                            {isMine && <span className="text-[10px] text-violet-400">✓✓</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef}/>
              </div>

              {/* Pending file previews */}
              {pendingFiles.length > 0 && (
                <div className="flex gap-2 px-5 py-2 border-t border-white/10 flex-wrap">
                  {pendingFiles.map((f,i) => (
                    <div key={i} className="relative group">
                      {f.type.startsWith("image/")
                        ? <img src={URL.createObjectURL(f)} className="w-16 h-16 object-cover rounded-lg border border-white/20"/>
                        : <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-lg flex flex-col items-center justify-center text-xs text-gray-400 text-center p-1">
                            <span className="text-xl">📄</span>
                            <span className="truncate w-full text-center leading-tight">{f.name.slice(0,8)}</span>
                          </div>
                      }
                      <button onClick={()=>setPendingFiles(prev=>prev.filter((_,j)=>j!==i))}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input bar */}
              <div className="p-4 border-t border-white/10 bg-[#0d0d1a]">
                {uploading && (
                  <div className="mb-2 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full transition-all" style={{width:`${uploadPct}%`}}/>
                  </div>
                )}
                <div className="flex items-end gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 focus-within:border-violet-500/50 transition-colors">
                  {/* Attach button */}
                  <button onClick={() => fileRef.current?.click()}
                    className="flex-shrink-0 text-gray-400 hover:text-violet-400 transition-colors p-1 self-end mb-0.5">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                    </svg>
                  </button>
                  <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt,.psd,.ai,.fig"
                    className="hidden" onChange={handleFileChange}/>

                  {/* Text input */}
                  <textarea ref={textRef} value={text} onChange={e=>setText(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="Write a message… (Enter to send, Shift+Enter for new line)"
                    rows={1}
                    className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none resize-none leading-relaxed max-h-32 overflow-y-auto"
                    style={{fieldSizing:"content"} as any}/>

                  {/* Send button */}
                  <button onClick={handleSend} disabled={sending || uploading || (!text.trim() && !pendingFiles.length)}
                    className="flex-shrink-0 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white p-2 rounded-xl transition-all self-end">
                    {sending || uploading
                      ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                      : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                    }
                  </button>
                </div>
                <p className="text-[10px] text-gray-600 mt-1.5 text-center">End-to-end encrypted · Images, PDFs, ZIP and more supported</p>
              </div>
            </div>
          ) : (
            // Empty state when no conversation selected
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 rounded-full bg-violet-500/15 flex items-center justify-center text-4xl mb-5">💬</div>
              <h2 className="text-xl font-bold text-white mb-2">Your Messages</h2>
              <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
                Connect with freelancers and clients. Go to the <strong className="text-violet-400">Marketplace</strong> to find a freelancer and start a conversation.
              </p>
              <button onClick={() => router.push("/dashboard/marketplace")}
                className="mt-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
                Browse Marketplace →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
