"use client";

import React, { useState, useEffect } from "react";
import { FreelancerUserProvider, useFreelancerUser } from "@/context/FreelancerUserContext";
import FreelancerSidebar from "@/components/freelancer/dashboard/FreelancerSidebar";

const API = `${process.env.NEXT_PUBLIC_API_URL}/api`;
const BANKS = [
  "Bank of Ceylon","Commercial Bank of Ceylon","Hatton National Bank (HNB)",
  "People's Bank","Sampath Bank","Seylan Bank","Nations Trust Bank",
  "DFCC Bank","NDB Bank","Pan Asia Banking Corporation",
  "Standard Chartered Bank","HSBC Sri Lanka","Union Bank","Cargills Bank",
];

type AccountType = "bank_lk" | "paypal";
interface Acc { id:string; type:AccountType; label:string; isPrimary:boolean; createdAt:string;
  bankName?:string; branchName?:string; accountNumber?:string; accountHolderName?:string; nic?:string; paypalEmail?:string; }
interface Wd  { id:string; amount:number; currency:string; status:string; createdAt:string; processedAt:string|null; note:string; }
interface Bal { escrowed:number; available:number; withdrawn:number; total:number; }

const statusCls = (s:string) => (({
  pending:"text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  processing:"text-blue-400 bg-blue-500/10 border-blue-500/30",
  completed:"text-green-400 bg-green-500/10 border-green-500/30",
  rejected:"text-red-400 bg-red-500/10 border-red-500/30",
} as any)[s]||"text-gray-400 bg-white/5 border-white/10");

function BankSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full bg-white/5 border border-white/10 hover:border-violet-500/50 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-left flex items-center justify-between transition-all outline-none"
      >
        <span className={value ? "text-white" : "text-gray-500"}>{value || "Select bank…"}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-[#13131f] border border-white/15 rounded-xl shadow-2xl overflow-hidden">
          <div className="max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
            {BANKS.map(b => (
              <button key={b} type="button"
                onClick={() => { onChange(b); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-all hover:bg-violet-600/20 hover:text-white ${value === b ? "bg-violet-600/30 text-violet-300 font-semibold" : "text-gray-300"}`}
              >{b}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Inner() {
  const { token, uid, userName, userInitial, userPhoto, category, authLoading } = useFreelancerUser();
  const [accounts,    setAccounts]    = useState<Acc[]>([]);
  const [withdrawals, setWithdrawals] = useState<Wd[]>([]);
  const [bal,         setBal]         = useState<Bal>({escrowed:0,available:0,withdrawn:0,total:0});
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState<"accounts"|"withdrawals">("accounts");
  const [showForm,    setShowForm]    = useState(false);
  const [fType,       setFType]       = useState<AccountType>("bank_lk");
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState<string|null>(null);
  const [toast,       setToast]       = useState<{msg:string;ok:boolean}|null>(null);
  // Withdrawal modal
  const [showWd,      setShowWd]      = useState(false);
  const [wdAmount,    setWdAmount]    = useState("");
  const [wdAccountId, setWdAccountId] = useState("");
  const [wdLoading,   setWdLoading]   = useState(false);
  const [bankName,    setBankName]    = useState("");
  const [branch,      setBranch]      = useState("");
  const [accNum,      setAccNum]      = useState("");
  const [holder,      setHolder]      = useState("");
  const [nic,         setNic]         = useState("");
  const [ppEmail,     setPpEmail]     = useState("");
  const [lbl,         setLbl]         = useState("");

  const toast$ = (msg:string, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3500); };

  useEffect(() => {
    if (!token || authLoading) return;
    const h = { Authorization:`Bearer ${token}` };
    Promise.all([
      fetch(`${API}/payout/accounts`,    {headers:h}).then(r=>r.json()),
      fetch(`${API}/payout/withdrawals`, {headers:h}).then(r=>r.json()),
      fetch(`${API}/payout/balance`,     {headers:h}).then(r=>r.json()),
    ]).then(([a,w,b]) => {
      if(a.success) setAccounts(a.accounts||[]);
      if(w.success) setWithdrawals(w.withdrawals||[]);
      if(b.success) setBal(b.balance);
    }).catch(console.error).finally(()=>setLoading(false));
  }, [token, authLoading]);

  const resetF = () => { setBankName(""); setBranch(""); setAccNum(""); setHolder(userName||""); setNic(""); setPpEmail(""); setLbl(""); };

  const handleSave = async () => {
    if (!token) return;
    if (fType==="bank_lk" && (!bankName||!accNum||!holder)) { toast$("Fill all required fields",false); return; }
    if (fType==="paypal"  && !ppEmail) { toast$("Enter your PayPal email",false); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API}/payout/accounts`, {
        method:"POST", headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},
        body: JSON.stringify({type:fType,label:lbl,bankName,branchName:branch,accountNumber:accNum,accountHolderName:holder,nic,paypalEmail:ppEmail}),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message);
      setAccounts(p=>[...p, d.account]);
      toast$("Payment account added!");
      setShowForm(false); resetF();
    } catch(e:any) { toast$(e.message||"Failed",false); }
    setSaving(false);
  };

  const setPrimary = async (id:string) => {
    if (!token) return;
    const r = await fetch(`${API}/payout/accounts/${id}/primary`,{method:"PUT",headers:{Authorization:`Bearer ${token}`}});
    const d = await r.json(); if(d.success) setAccounts(d.accounts);
  };

  const deleteAcc = async (id:string) => {
    if (!token||!confirm("Remove this account?")) return;
    setDeleting(id);
    const r = await fetch(`${API}/payout/accounts/${id}`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}});
    const d = await r.json(); if(d.success){setAccounts(d.accounts);toast$("Removed");}
    setDeleting(null);
  };

  const handleWithdraw = async () => {
    if (!token) return;
    const amt = Number(wdAmount);
    if (!amt || amt < 100) { toast$("Minimum withdrawal is LKR 100", false); return; }
    if (amt > bal.available) { toast$(`Max available: LKR ${bal.available.toLocaleString()}`, false); return; }
    setWdLoading(true);
    try {
      const res = await fetch(`${API}/payout/request`, {
        method:"POST", headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},
        body: JSON.stringify({ amount: amt, accountId: wdAccountId || undefined }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message);
      toast$(`✅ LKR ${amt.toLocaleString()} withdrawn successfully!`);
      setShowWd(false); setWdAmount(""); setWdAccountId("");
      // Refresh data
      const h = { Authorization:`Bearer ${token}` };
      Promise.all([
        fetch(`${API}/payout/withdrawals`,{headers:h}).then(r=>r.json()),
        fetch(`${API}/payout/balance`,{headers:h}).then(r=>r.json()),
      ]).then(([w,b])=>{ if(w.success)setWithdrawals(w.withdrawals||[]); if(b.success)setBal(b.balance); });
    } catch(e:any) { toast$(e.message||"Failed",false); }
    setWdLoading(false);
  };

  if (authLoading||loading) return (
    <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#0a0a14] overflow-hidden text-white">
      <FreelancerSidebar userName={userName} userInitial={userInitial} userPhoto={userPhoto} category={category}/>
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="px-6 py-8 max-w-3xl mx-auto">
          {toast && (
            <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-xl border ${
              toast.ok?"bg-green-500/20 border-green-500/40 text-green-300":"bg-red-500/20 border-red-500/40 text-red-300"}`}>
              {toast.msg}
            </div>
          )}

          <div className="flex items-center gap-3 mb-7">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-xl">💳</div>
            <div>
              <h1 className="text-xl font-bold">Payout Settings</h1>
              <p className="text-xs text-gray-400">Manage your payment accounts & earnings</p>
            </div>
          </div>

          {/* Balance */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[{l:"In Escrow",v:bal.escrowed,c:"#3b82f6",i:"🔒"},{l:"Available",v:bal.available,c:"#22c55e",i:"💰"},
              {l:"Withdrawn",v:bal.withdrawn,c:"#a855f7",i:"🏦"},{l:"Total",v:bal.total,c:"#f59e0b",i:"📈"}].map(b=>(
              <div key={b.l} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1.5"><span>{b.i}</span><span className="text-[11px] text-gray-400">{b.l}</span></div>
                <p className="text-lg font-extrabold" style={{color:b.c}}>LKR {b.v>=1000?`${Math.round(b.v/1000)}k`:b.v.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {bal.available > 0 && (
            <div className="bg-green-500/10 border border-green-500/25 rounded-2xl p-4 flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💸</span>
                <div>
                  <p className="text-sm font-bold text-green-300">LKR {bal.available.toLocaleString()} ready to withdraw!</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {accounts.length === 0
                      ? "Add a payment account first to request withdrawal."
                      : `Will be sent to: ${accounts.find(a=>a.isPrimary)?.label || accounts[0]?.label}`}
                  </p>
                </div>
              </div>
              {accounts.length > 0 && (
                <button
                  onClick={() => { setWdAmount(String(bal.available)); setShowWd(true); }}
                  className="flex-shrink-0 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg"
                >
                  Withdraw →
                </button>
              )}
            </div>
          )}

          {/* ── Withdrawal modal ── */}
          {showWd && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#0d0d1a] border border-white/15 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600/25 to-emerald-600/15 border-b border-white/10 px-6 py-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-extrabold text-white">💸 Request Withdrawal</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Available: <span className="text-green-400 font-bold">LKR {bal.available.toLocaleString()}</span></p>
                  </div>
                  <button onClick={()=>setShowWd(false)} className="text-gray-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all text-xl">✕</button>
                </div>

                <div className="p-6 space-y-5">
                  {/* Amount */}
                  <div>
                    <label className="text-xs text-gray-400 font-semibold mb-2 block">Amount (LKR) *</label>
                    <div className="relative">
                      <input
                        type="number" min="100" max={bal.available}
                        value={wdAmount} onChange={e=>setWdAmount(e.target.value)}
                        placeholder="Enter amount…"
                        className="w-full bg-white/5 border border-white/10 focus:border-green-500 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none transition-all"
                      />
                      <button
                        onClick={()=>setWdAmount(String(bal.available))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1 rounded-lg font-semibold hover:bg-green-500/30 transition-all"
                      >Max</button>
                    </div>
                    <p className="text-[11px] text-gray-600 mt-1.5">Minimum: LKR 100</p>
                  </div>

                  {/* Account selector */}
                  <div>
                    <label className="text-xs text-gray-400 font-semibold mb-2 block">Send to Account *</label>
                    <div className="space-y-2">
                      {accounts.map(acc => (
                        <button
                          key={acc.id}
                          onClick={()=>setWdAccountId(acc.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                            (wdAccountId===acc.id||(wdAccountId===""&&acc.isPrimary))
                              ? "bg-green-500/10 border-green-500/40"
                              : "bg-white/5 border-white/10 hover:border-white/25"
                          }`}
                        >
                          <span className="text-xl">{acc.type==="bank_lk"?"🏦":"🅿️"}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{acc.label}</p>
                            <p className="text-xs text-gray-500">
                              {acc.type==="bank_lk"
                                ? `${acc.bankName} ••••${(acc.accountNumber||"").slice(-4)}`
                                : acc.paypalEmail}
                            </p>
                          </div>
                          {acc.isPrimary && <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-bold flex-shrink-0">Primary</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  {wdAmount && Number(wdAmount) > 0 && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-400">You'll receive</span><span className="font-bold text-green-400">LKR {Number(wdAmount).toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Remaining balance</span><span className="font-semibold text-white">LKR {Math.max(0, bal.available - Number(wdAmount)).toLocaleString()}</span></div>
                      <p className="text-[11px] text-gray-500 pt-1 border-t border-white/10">Processing time: 1–3 business days</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button onClick={()=>setShowWd(false)} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-xl font-semibold text-sm text-gray-300 transition-all">Cancel</button>
                    <button onClick={handleWithdraw} disabled={wdLoading||!wdAmount||Number(wdAmount)<100}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">
                      {wdLoading
                        ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Processing…</>
                        : "Submit Request →"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 mb-5">
            {(["accounts","withdrawals"] as const).map(t=>(
              <button key={t} onClick={()=>setTab(t)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${tab===t?"bg-violet-600 border-violet-500":"bg-white/5 border-white/10 text-gray-400 hover:text-white"}`}>
                {t==="accounts"?"Payment Accounts":"Withdrawal History"}
              </button>
            ))}
          </div>

          {/* ACCOUNTS */}
          {tab==="accounts" && (
            <div className="space-y-4">
              {accounts.length===0 && !showForm && (
                <div className="bg-[#0d0d1a] border border-white/10 rounded-2xl p-10 text-center">
                  <div className="text-5xl mb-3">🏦</div>
                  <p className="text-gray-400 text-sm mb-5">No payment accounts yet. Add one to receive your earnings.</p>
                  <button onClick={()=>setShowForm(true)} className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-all">
                    + Add Payment Account
                  </button>
                </div>
              )}

              {accounts.map(acc=>(
                <div key={acc.id} className={`relative bg-white/5 border rounded-2xl p-5 ${acc.isPrimary?"border-green-500/40 bg-green-500/5":"border-white/10"}`}>
                  {acc.isPrimary && <span className="absolute top-3 right-3 text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2.5 py-1 rounded-full font-bold">✓ Primary</span>}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-2xl flex-shrink-0">
                      {acc.type==="bank_lk"?"🏦":"🅿️"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold">{acc.label}</p>
                      {acc.type==="bank_lk" && (
                        <div className="mt-1 space-y-0.5 text-xs text-gray-400">
                          <p><span className="text-gray-500">Bank:</span> {acc.bankName}{acc.branchName&&` — ${acc.branchName}`}</p>
                          <p><span className="text-gray-500">Account:</span> {"•".repeat(Math.max(0,(acc.accountNumber||"").length-4))}{(acc.accountNumber||"").slice(-4)}</p>
                          <p><span className="text-gray-500">Holder:</span> {acc.accountHolderName}</p>
                          {acc.nic&&<p><span className="text-gray-500">NIC:</span> {acc.nic}</p>}
                        </div>
                      )}
                      {acc.type==="paypal" && <p className="text-xs text-gray-400 mt-1"><span className="text-gray-500">PayPal:</span> {acc.paypalEmail}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    {!acc.isPrimary && (
                      <button onClick={()=>setPrimary(acc.id)} className="text-xs bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 px-3 py-1.5 rounded-lg font-semibold transition-all">Set as Primary</button>
                    )}
                    <button onClick={()=>deleteAcc(acc.id)} disabled={deleting===acc.id}
                      className="text-xs bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-lg font-semibold transition-all disabled:opacity-50">
                      {deleting===acc.id?"Removing…":"Remove"}
                    </button>
                  </div>
                </div>
              ))}

              {accounts.length>0 && !showForm && (
                <button onClick={()=>setShowForm(true)} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-500/40 py-3.5 rounded-2xl font-semibold text-sm text-gray-300 transition-all">
                  + Add Another Account
                </button>
              )}

              {showForm && (
                <div className="bg-[#0d0d1a] border border-white/15 rounded-2xl overflow-hidden">
                  <div className="bg-white/5 border-b border-white/10 px-5 py-4 flex items-center justify-between">
                    <h3 className="text-sm font-bold">Add Payment Account</h3>
                    <button onClick={()=>{setShowForm(false);resetF();}} className="text-gray-500 hover:text-white text-lg w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10">✕</button>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {[{k:"bank_lk",i:"🏦",l:"Sri Lankan Bank",d:"Local bank transfer"},{k:"paypal",i:"🅿️",l:"PayPal",d:"International"}].map(t=>(
                        <button key={t.k} onClick={()=>setFType(t.k as AccountType)}
                          className={`p-4 rounded-xl border text-left transition-all ${fType===t.k?"bg-violet-600/20 border-violet-500/60":"bg-white/5 border-white/10 hover:border-white/25"}`}>
                          <div className="text-2xl mb-1">{t.i}</div>
                          <p className="text-sm font-bold">{t.l}</p>
                          <p className="text-[11px] text-gray-500">{t.d}</p>
                        </button>
                      ))}
                    </div>
                    <hr className="border-white/10"/>

                    {fType==="bank_lk" && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Bank *</label>
                          <BankSelect value={bankName} onChange={setBankName} />
                        </div>
                        {[
                          {l:"Branch",v:branch,fn:setBranch,ph:"e.g. Colombo 03"},
                          {l:"Account Number *",v:accNum,fn:(v:string)=>setAccNum(v.replace(/\D/g,"")),ph:"0001234567890"},
                          {l:"Account Holder Name *",v:holder,fn:setHolder,ph:"Full name as on bank account"},
                          {l:"NIC / Passport",v:nic,fn:setNic,ph:"e.g. 200012345678"},
                          {l:"Label",v:lbl,fn:setLbl,ph:"e.g. My HNB Account"},
                        ].map(f=>(
                          <div key={f.l}>
                            <label className="text-xs text-gray-400 font-semibold mb-1.5 block">{f.l}</label>
                            <input value={f.v} onChange={e=>f.fn(e.target.value)} placeholder={f.ph}
                              className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none transition-all"/>
                          </div>
                        ))}
                      </div>
                    )}

                    {fType==="paypal" && (
                      <div className="space-y-3">
                        {[{l:"PayPal Email *",v:ppEmail,fn:setPpEmail,ph:"you@example.com",t:"email"},{l:"Label",v:lbl,fn:setLbl,ph:"e.g. My PayPal"}].map(f=>(
                          <div key={f.l}>
                            <label className="text-xs text-gray-400 font-semibold mb-1.5 block">{f.l}</label>
                            <input type={(f as any).t||"text"} value={f.v} onChange={e=>f.fn(e.target.value)} placeholder={f.ph}
                              className="w-full bg-white/5 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none transition-all"/>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                      <span className="text-sm">🔒</span>
                      <p className="text-xs text-amber-300/80">Your details are encrypted and only used for payouts from DM Assistant.</p>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={()=>{setShowForm(false);resetF();}} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-xl font-semibold text-sm text-gray-300 transition-all">Cancel</button>
                      <button onClick={handleSave} disabled={saving} className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 py-3 rounded-xl font-bold text-sm transition-all">
                        {saving?"Saving…":"Save Account →"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* WITHDRAWALS */}
          {tab==="withdrawals" && (
            <div className="space-y-3">
              {withdrawals.length===0 ? (
                <div className="bg-[#0d0d1a] border border-white/10 rounded-2xl p-10 text-center">
                  <div className="text-5xl mb-3">📭</div>
                  <p className="text-gray-400 text-sm">No withdrawals yet. Earnings appear here once clients approve your work.</p>
                </div>
              ) : withdrawals.map(w=>(
                <div key={w.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/15 border border-green-500/25 flex items-center justify-center text-lg">💸</div>
                    <div>
                      <p className="text-sm font-bold">LKR {w.amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{new Date(w.createdAt).toLocaleDateString("en-LK",{day:"numeric",month:"short",year:"numeric"})}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full border capitalize ${statusCls(w.status)}`}>{w.status}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 bg-white/4 border border-white/8 rounded-2xl p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">How Payments Work</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[{i:"📋",l:"Client hires you",d:"Hire request sent"},{i:"✅",l:"You accept",d:"Work begins"},
                {i:"💳",l:"Client pays",d:"Funds held in escrow"},{i:"🔓",l:"Client approves",d:"Balance released"},{i:"💸",l:"You withdraw",d:"Instant to your account"}].map((s,idx)=>(
                <div key={idx} className="text-center">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-lg mx-auto mb-1.5">{s.i}</div>
                  <p className="text-xs font-bold">{s.l}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PayoutSettingsPage() {
  return <FreelancerUserProvider><Inner/></FreelancerUserProvider>;
}
