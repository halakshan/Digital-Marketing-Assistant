"use client";

import { useState, useEffect, useRef } from "react";
import {
  collection, doc, addDoc, updateDoc, onSnapshot,
  query, where, serverTimestamp,
} from "firebase/firestore";
import {
  ref as storageRef, uploadBytesResumable, getDownloadURL,
} from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useFreelancerUser } from "@/context/FreelancerUserContext";

// ── Theme ────────────────────────────────────────────────────────────────────
const C = {
  bg:      "#0d0f1a",
  surface: "#111827",
  card:    "#1a2035",
  border:  "rgba(255,255,255,0.08)",
  text:    "#e2e8f0",
  muted:   "#64748b",
  accent:  "#7c3aed",
  accent2: "#3b82f6",
  sent:    "linear-gradient(135deg,#7c3aed,#3b82f6)",
  recv:    "#1e293b",
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface Attachment { type:"image"|"file"; url:string; name:string; size:number; }
interface Message {
  id:string; conversationId:string; senderUid:string; senderName:string;
  senderPhoto:string; text:string; attachments:Attachment[]; createdAt:any;
}
interface Conversation {
  id:string; clientUid:string; clientName:string; clientPhoto:string;
  freelancerUid:string; freelancerName:string; freelancerPhoto:string;
  lastMessage:string; lastMessageAt:any; unreadClient:number; unreadFreelancer:number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(date:any):string {
  if (!date) return "";
  const d = date?.toDate ? date.toDate() : new Date(date);
  const s = Math.floor((Date.now()-d.getTime())/1000);
  if (s<60)    return "Just now";
  if (s<3600)  return `${Math.floor(s/60)}m`;
  if (s<86400) return `${Math.floor(s/3600)}h`;
  return d.toLocaleDateString("en-US",{month:"short",day:"numeric"});
}
function fmtTime(date:any):string {
  if (!date) return "";
  const d = date?.toDate ? date.toDate() : new Date(date);
  return d.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
}
function fmtDate(date:any):string {
  if (!date) return "";
  const d = date?.toDate ? date.toDate() : new Date(date);
  const now=new Date();
  if (d.toDateString()===now.toDateString()) return "Today";
  const y=new Date(now); y.setDate(y.getDate()-1);
  if (d.toDateString()===y.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"});
}
function fmtSize(b:number):string {
  if (b<1024) return `${b} B`;
  if (b<1048576) return `${(b/1024).toFixed(1)} KB`;
  return `${(b/1048576).toFixed(1)} MB`;
}
function initials(name:string){ return (name||"?").charAt(0).toUpperCase(); }

async function uploadAttachment(file:File,convId:string):Promise<Attachment>{
  const path=`chat-attachments/${convId}/${Date.now()}_${file.name}`;
  const sRef=storageRef(storage,path);
  await new Promise<void>((res,rej)=>{
    const t=uploadBytesResumable(sRef,file);
    t.on("state_changed",null,rej,()=>res());
  });
  const url=await getDownloadURL(sRef);
  return {type:file.type.startsWith("image/")?"image":"file",url,name:file.name,size:file.size};
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function FreelancerMessagesPage() {
  const { firebaseUser, userName, userPhoto, uid, authLoading } = useFreelancerUser();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId,  setActiveConvId]  = useState("");
  const [messages,      setMessages]      = useState<Message[]>([]);
  const [text,          setText]          = useState("");
  const [pendingFiles,  setPendingFiles]  = useState<File[]>([]);
  const [sending,       setSending]       = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const [search,        setSearch]        = useState("");
  const [loading,       setLoading]       = useState(true);

  const endRef  = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  // ── Load conversations — deduplicated by client UID ──
  useEffect(()=>{
    if (!uid) return;
    const q = query(collection(db,"conversations"), where("freelancerUid","==",uid));
    const unsub = onSnapshot(q, snap=>{
      const sorted = snap.docs
        .map(d=>({id:d.id,...d.data()} as Conversation))
        .sort((a,b)=>{
          const ta = a.lastMessageAt?.toMillis?.() ?? (a.lastMessageAt?.seconds ? a.lastMessageAt.seconds*1000 : 0);
          const tb = b.lastMessageAt?.toMillis?.() ?? (b.lastMessageAt?.seconds ? b.lastMessageAt.seconds*1000 : 0);
          return tb-ta;
        });

      // Keep only the most recent conversation per client
      const deduped: Conversation[] = [];
      const seenClients = new Set<string>();
      for (const conv of sorted) {
        if (!seenClients.has(conv.clientUid)) {
          seenClients.add(conv.clientUid);
          deduped.push(conv);
        }
      }

      setConversations(deduped);
      setLoading(false);
      setActiveConvId(prev => prev || (deduped.length ? deduped[0].id : ""));
    }, err => { if (err.code !== "permission-denied") console.error("Conv:", err); });
    return ()=>unsub();
  },[uid]);

  // ── Load messages — no orderBy to avoid needing a composite index ──
  useEffect(()=>{
    if (!activeConvId) return;
    setMessages([]);
    const q = query(
      collection(db,"messages"),
      where("conversationId","==",activeConvId)
    );
    const unsub = onSnapshot(q, snap=>{
      const msgs = snap.docs
        .map(d=>({id:d.id,...d.data()} as Message))
        .sort((a,b)=>{
          const ta = a.createdAt?.toMillis?.() ?? (a.createdAt?.seconds ? a.createdAt.seconds*1000 : 0);
          const tb = b.createdAt?.toMillis?.() ?? (b.createdAt?.seconds ? b.createdAt.seconds*1000 : 0);
          return ta - tb;
        });
      setMessages(msgs);
      if (uid) markRead(activeConvId,uid);
    }, err=>console.error("Messages error:",err));
    return ()=>unsub();
  },[activeConvId,uid]);

  // ── Auto-scroll ──
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[messages]);

  const markRead = async (convId:string,myUid:string)=>{
    try {
      const conv=conversations.find(c=>c.id===convId);
      if (conv && conv.unreadFreelancer>0)
        await updateDoc(doc(db,"conversations",convId),{unreadFreelancer:0});
    } catch {}
  };

  const handleSend = async ()=>{
    if (!uid||!activeConvId) return;
    if (!text.trim()&&pendingFiles.length===0) return;
    setSending(true);
    try {
      const atts:Attachment[]=[];
      for (const f of pendingFiles){
        setUploading(true);
        atts.push(await uploadAttachment(f,activeConvId));
      }
      setUploading(false); setPendingFiles([]);

      const conv=conversations.find(c=>c.id===activeConvId);
      const preview=text.trim()||(atts.length?`📎 ${atts[0].name}`:"");

      await addDoc(collection(db,"messages"),{
        conversationId:activeConvId,
        senderUid:uid, senderName:userName, senderPhoto:userPhoto||"",
        text:text.trim(), attachments:atts, createdAt:serverTimestamp(),
      });
      await updateDoc(doc(db,"conversations",activeConvId),{
        lastMessage:preview, lastMessageAt:serverTimestamp(), lastSenderUid:uid,
        unreadClient:(conv?.unreadClient||0)+1,
      });

      // Notify client about new message
      if (conv?.clientUid) {
        await addDoc(collection(db,"notifications"),{
          userId:    conv.clientUid,
          type:      "message",
          title:     `New message from ${userName}`,
          body:      preview.slice(0,100),
          read:      false,
          actionUrl: "/dashboard/messages",
          createdAt: serverTimestamp(),
        });
      }

      setText(""); textRef.current?.focus();
    } catch(e){ console.error(e); }
    finally { setSending(false); }
  };

  const handleKey = (e:React.KeyboardEvent)=>{
    if (e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); handleSend(); }
  };

  const handleFileChange=(e:React.ChangeEvent<HTMLInputElement>)=>{
    setPendingFiles(p=>[...p,...Array.from(e.target.files||[])]);
    e.target.value="";
  };

  const activeConv   = conversations.find(c=>c.id===activeConvId);
  const clientName   = activeConv?.clientName||"";
  const clientPhoto  = activeConv?.clientPhoto||"";
  const filteredConvs= conversations.filter(c=>
    c.clientName.toLowerCase().includes(search.toLowerCase())
  );

  const needsSep=(msgs:Message[],i:number)=>{
    if (i===0) return true;
    if (!msgs[i-1].createdAt || !msgs[i].createdAt) return false;
    const a=msgs[i-1].createdAt?.toDate?.() ?? new Date(msgs[i-1].createdAt);
    const b=msgs[i].createdAt?.toDate?.() ?? new Date(msgs[i].createdAt);
    return a.toDateString()!==b.toDateString();
  };

  if (authLoading) return null;

  return (
    <div style={{height:"calc(100vh - 64px)",display:"flex",fontFamily:"'Sora',sans-serif",color:C.text,background:C.bg}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:10px;}
        textarea::placeholder{color:${C.muted};}
        input::placeholder{color:${C.muted};}
      `}</style>

      {/* ── Conversation List ── */}
      <div style={{width:300,background:C.surface,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
        {/* Header */}
        <div style={{padding:"18px 16px",borderBottom:`1px solid ${C.border}`}}>
          <p style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:12}}>Messages</p>
          <div style={{display:"flex",alignItems:"center",gap:8,background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"8px 12px"}}>
            <svg width="14" height="14" fill="none" stroke={C.muted} strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search clients…"
              style={{background:"none",border:"none",outline:"none",color:C.text,fontSize:13,fontFamily:"'Sora',sans-serif",width:"100%"}}/>
          </div>
        </div>

        {/* List */}
        <div style={{flex:1,overflowY:"auto"}}>
          {loading && <div style={{padding:24,textAlign:"center",color:C.muted,fontSize:13}}>Loading…</div>}
          {!loading&&filteredConvs.length===0&&(
            <div style={{padding:32,textAlign:"center"}}>
              <div style={{fontSize:36,marginBottom:8}}>💬</div>
              <p style={{color:C.muted,fontSize:13}}>No messages yet</p>
              <p style={{color:C.muted,fontSize:11,marginTop:4,opacity:0.6}}>Clients can message you from the marketplace</p>
            </div>
          )}
          {filteredConvs.map(conv=>{
            const isActive=conv.id===activeConvId;
            const unread=conv.unreadFreelancer||0;
            return (
              <button key={conv.id} onClick={()=>setActiveConvId(conv.id)} style={{
                width:"100%",display:"flex",alignItems:"center",gap:12,padding:"12px 16px",
                textAlign:"left",cursor:"pointer",border:"none",borderBottom:`1px solid ${C.border}`,
                background:isActive?"rgba(124,58,237,0.15)":C.surface,
                borderLeft:isActive?`3px solid ${C.accent}`:"3px solid transparent",
                transition:"background 0.15s",
              }}>
                <div style={{position:"relative",flexShrink:0}}>
                  {conv.clientPhoto
                    ? <img src={conv.clientPhoto} style={{width:40,height:40,borderRadius:"50%",objectFit:"cover"}}/>
                    : <div style={{width:40,height:40,borderRadius:"50%",background:C.sent,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:15,color:"#fff"}}>{initials(conv.clientName)}</div>
                  }
                  {unread>0&&(
                    <span style={{position:"absolute",top:-4,right:-4,background:C.accent,color:"#fff",fontSize:10,fontWeight:700,borderRadius:"50%",width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center"}}>{unread}</span>
                  )}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:13,fontWeight:600,color:isActive?"#fff":C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:140}}>{conv.clientName||"Client"}</span>
                    <span style={{fontSize:10,color:C.muted,flexShrink:0}}>{timeAgo(conv.lastMessageAt)}</span>
                  </div>
                  <p style={{fontSize:12,color:C.muted,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{conv.lastMessage||"Start the conversation…"}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{padding:"10px 16px",borderTop:`1px solid ${C.border}`,fontSize:11,color:C.muted}}>
          {conversations.filter(c=>c.unreadFreelancer>0).length} unread conversations
        </div>
      </div>

      {/* ── Chat Window ── */}
      {activeConvId&&activeConv ? (
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
          {/* Header */}
          <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 20px",borderBottom:`1px solid ${C.border}`,background:C.surface,flexShrink:0}}>
            <div style={{position:"relative",flexShrink:0}}>
              {clientPhoto
                ? <img src={clientPhoto} style={{width:40,height:40,borderRadius:"50%",objectFit:"cover",border:"2px solid rgba(124,58,237,0.4)"}}/>
                : <div style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#7c3aed,#3b82f6)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:15,color:"#fff",border:"2px solid rgba(124,58,237,0.4)"}}>{initials(clientName)}</div>
              }
              <span style={{position:"absolute",bottom:0,right:0,width:11,height:11,background:"#22c55e",borderRadius:"50%",border:"2px solid #111827"}}/>
            </div>
            <div style={{flex:1}}>
              <p style={{fontSize:14,fontWeight:700,color:C.text,lineHeight:1.2}}>{clientName||"Client"}</p>
              <p style={{fontSize:11,color:"#22c55e",fontWeight:600}}>👤 Client · Online</p>
            </div>
            <div style={{fontSize:11,color:C.muted,background:C.card,border:`1px solid ${C.border}`,padding:"4px 12px",borderRadius:20}}>
              {messages.length} messages
            </div>
          </div>

          {/* Messages area */}
          <div style={{flex:1,overflowY:"auto",padding:"20px 16px",display:"flex",flexDirection:"column",gap:10,background:"linear-gradient(180deg,#0d0f1a 0%,#111827 100%)"}}>
            {messages.length===0&&(
              <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",color:C.muted,paddingBottom:40}}>
                <div style={{width:64,height:64,borderRadius:"50%",background:"rgba(124,58,237,0.15)",border:"1px solid rgba(124,58,237,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,marginBottom:16}}>👋</div>
                <p style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:6}}>Say hello to {clientName}!</p>
                <p style={{fontSize:12}}>This is the start of your conversation.</p>
              </div>
            )}
            {messages.map((msg,idx)=>{
              const isMine      = msg.senderUid===uid;
              const showSep     = needsSep(messages,idx);
              const showAvatar  = !isMine && (idx===0 || messages[idx-1]?.senderUid!==msg.senderUid);
              const showName    = !isMine && showAvatar;
              return (
                <div key={msg.id}>
                  {/* Date separator */}
                  {showSep&&(
                    <div style={{display:"flex",alignItems:"center",gap:10,margin:"8px 0"}}>
                      <div style={{flex:1,height:1,background:C.border}}/>
                      <span style={{fontSize:11,color:C.muted,background:"#111827",border:`1px solid ${C.border}`,padding:"2px 12px",borderRadius:20,fontWeight:600}}>{fmtDate(msg.createdAt)}</span>
                      <div style={{flex:1,height:1,background:C.border}}/>
                    </div>
                  )}

                  {/* Message row */}
                  <div style={{display:"flex",alignItems:"flex-end",gap:10,flexDirection:isMine?"row-reverse":"row"}}>

                    {/* Avatar / spacer */}
                    {isMine
                      ? <div style={{width:32,flexShrink:0}}/>
                      : showAvatar
                        ? (msg.senderPhoto
                            ? <img src={msg.senderPhoto} style={{width:32,height:32,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:`1px solid ${C.border}`,alignSelf:"flex-end",marginBottom:2}}/>
                            : <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#ec4899,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff",flexShrink:0,border:`1px solid ${C.border}`,alignSelf:"flex-end",marginBottom:2}}>{initials(msg.senderName)}</div>
                          )
                        : <div style={{width:32,flexShrink:0}}/>
                    }

                    {/* Bubble column */}
                    <div style={{maxWidth:"65%",display:"flex",flexDirection:"column",alignItems:isMine?"flex-end":"flex-start",gap:4}}>

                      {/* Sender name label */}
                      {showName&&(
                        <span style={{fontSize:11,fontWeight:700,color:"#a78bfa",marginLeft:4,marginBottom:2}}>{msg.senderName}</span>
                      )}

                      {/* Text bubble */}
                      {msg.text&&(
                        <div style={{
                          padding:"10px 16px",
                          borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                          fontSize:13,lineHeight:1.6,whiteSpace:"pre-wrap",wordBreak:"break-word",
                          background: isMine ? "linear-gradient(135deg,#7c3aed,#3b82f6)" : "#1e2235",
                          color:"#e2e8f0",
                          border: isMine ? "none" : `1px solid ${C.border}`,
                          boxShadow: isMine ? "0 2px 12px rgba(124,58,237,0.3)" : "none",
                        }}>{msg.text}</div>
                      )}

                      {/* Attachments */}
                      {(msg.attachments||[]).map((att,ai)=>(
                        <div key={ai} style={{marginTop:2}}>
                          {att.type==="image"?(
                            <a href={att.url} target="_blank" rel="noopener noreferrer">
                              <img src={att.url} alt={att.name} style={{maxWidth:240,maxHeight:200,objectFit:"cover",borderRadius:12,cursor:"pointer",display:"block",border:`1px solid ${isMine?"rgba(124,58,237,0.3)":C.border}`}}/>
                            </a>
                          ):(
                            <a href={att.url} target="_blank" rel="noopener noreferrer"
                              style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:12,
                                background:isMine?"rgba(124,58,237,0.3)":"#1e2235",
                                border:`1px solid ${isMine?"rgba(124,58,237,0.4)":C.border}`,
                                fontSize:12,color:C.text,textDecoration:"none",minWidth:160}}>
                              <span style={{fontSize:18}}>📎</span>
                              <div style={{flex:1,minWidth:0}}>
                                <p style={{fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{att.name}</p>
                                <p style={{fontSize:10,color:C.muted,marginTop:1}}>{fmtSize(att.size)}</p>
                              </div>
                              <span style={{opacity:0.5,fontSize:12}}>↓</span>
                            </a>
                          )}
                        </div>
                      ))}

                      {/* Time + tick */}
                      <div style={{display:"flex",alignItems:"center",gap:4,flexDirection:isMine?"row-reverse":"row",paddingLeft:isMine?0:4,paddingRight:isMine?4:0}}>
                        <span style={{fontSize:10,color:C.muted}}>{fmtTime(msg.createdAt)}</span>
                        {isMine&&<span style={{fontSize:10,color:"#a78bfa"}}>✓✓</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={endRef}/>
          </div>

          {/* Pending file previews */}
          {pendingFiles.length>0&&(
            <div style={{display:"flex",gap:8,padding:"8px 16px",borderTop:`1px solid ${C.border}`,flexWrap:"wrap"}}>
              {pendingFiles.map((f,i)=>(
                <div key={i} style={{position:"relative"}}>
                  {f.type.startsWith("image/")
                    ? <img src={URL.createObjectURL(f)} style={{width:56,height:56,objectFit:"cover",borderRadius:8,border:`1px solid ${C.border}`}}/>
                    : <div style={{width:56,height:56,background:C.card,border:`1px solid ${C.border}`,borderRadius:8,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontSize:10,color:C.muted}}>
                        <span style={{fontSize:18}}>📄</span>
                        <span style={{fontSize:9,marginTop:2,maxWidth:48,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textAlign:"center"}}>{f.name}</span>
                      </div>
                  }
                  <button onClick={()=>setPendingFiles(p=>p.filter((_,j)=>j!==i))} style={{
                    position:"absolute",top:-6,right:-6,background:"#ef4444",border:"none",
                    borderRadius:"50%",width:16,height:16,fontSize:9,cursor:"pointer",
                    color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",
                  }}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Input bar */}
          <div style={{padding:16,borderTop:`1px solid ${C.border}`,background:C.surface,flexShrink:0}}>
            <div style={{display:"flex",alignItems:"flex-end",gap:10,background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"10px 14px",transition:"border-color 0.2s"}}>
              {/* Attach */}
              <button onClick={()=>fileRef.current?.click()} title="Attach file" style={{
                background:"none",border:"none",cursor:"pointer",color:C.muted,flexShrink:0,
                padding:4,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",
                marginBottom:2,
              }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                </svg>
              </button>
              <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt,.psd,.ai,.fig"
                style={{display:"none"}} onChange={handleFileChange}/>

              {/* Textarea */}
              <textarea ref={textRef} value={text} onChange={e=>setText(e.target.value)} onKeyDown={handleKey}
                placeholder="Write a message… (Enter to send, Shift+Enter for new line)"
                rows={1}
                style={{
                  flex:1,background:"none",border:"none",outline:"none",resize:"none",
                  color:C.text,fontSize:13,fontFamily:"'Sora',sans-serif",lineHeight:1.5,
                  maxHeight:120,overflowY:"auto",
                }}/>

              {/* Send */}
              <button onClick={handleSend} disabled={sending||uploading||(!text.trim()&&!pendingFiles.length)} style={{
                background:C.sent,border:"none",borderRadius:10,padding:"8px 14px",
                cursor:"pointer",color:"#fff",flexShrink:0,display:"flex",alignItems:"center",
                justifyContent:"center",opacity:(sending||uploading||(!text.trim()&&!pendingFiles.length))?0.4:1,
                transition:"opacity 0.2s",marginBottom:2,
              }}>
                {sending||uploading
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{animation:"spin 0.8s linear infinite"}}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
                    </svg>
                  : <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                    </svg>
                }
              </button>
            </div>
            <p style={{fontSize:10,color:C.muted,textAlign:"center",marginTop:6}}>Images, PDFs, ZIP and more · Enter to send</p>
          </div>
        </div>
      ) : (
        // Empty state
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:40,color:C.muted}}>
          <div style={{width:72,height:72,borderRadius:"50%",background:"rgba(124,58,237,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,marginBottom:20}}>💬</div>
          <p style={{fontSize:18,fontWeight:700,color:C.text,marginBottom:8}}>No Messages Yet</p>
          <p style={{fontSize:13,lineHeight:1.6,maxWidth:280}}>
            When clients message you from the marketplace, their conversations will appear here.
          </p>
          <p style={{fontSize:11,marginTop:12,opacity:0.6}}>Complete your profile to attract more clients.</p>
        </div>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
