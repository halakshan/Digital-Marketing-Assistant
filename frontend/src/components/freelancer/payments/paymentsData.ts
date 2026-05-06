export const PAYMENTS = [
  { id: 1, icon: "🎨", title: "Social Media Kit – Ceylonara Foods", client: "Amal Perera",   amount: 45000, date: "Mar 10, 2026", method: "Stripe", type: "received", status: "completed"  },
  { id: 2, icon: "🎬", title: "Video Ad – Sathosa Promotion",        client: "Nimal Silva",   amount: 30000, date: "Mar 5, 2026",  method: "PayPal", type: "received", status: "completed"  },
  { id: 3, icon: "💳", title: "Withdrawal to Bank Account",           client: "—",             amount: 40000, date: "Mar 3, 2026",  method: "Bank",   type: "withdraw", status: "completed"  },
  { id: 4, icon: "🏷️", title: "Logo Design – TechStart LK",          client: "Priya Beauty",  amount: 22000, date: "Feb 28, 2026", method: "Stripe", type: "received", status: "completed"  },
  { id: 5, icon: "📧", title: "Email Campaign – Ceylon Organics",     client: "Sumudu Lanka",  amount: 17000, date: "Feb 20, 2026", method: "PayPal", type: "received", status: "completed"  },
  { id: 6, icon: "⏳", title: "Video Ad – Sathosa (Balance)",         client: "Nimal Silva",   amount: 30000, date: "Mar 22, 2026", method: "Stripe", type: "received", status: "pending"    },
  { id: 7, icon: "💳", title: "Withdrawal Request",                   client: "—",             amount: 20000, date: "Mar 12, 2026", method: "Bank",   type: "withdraw", status: "processing" },
];

export const METHODS = [
  { icon: "💳", name: "Stripe",       detail: "****4242",               primary: true  },
  { icon: "🅿️", name: "PayPal",       detail: "kasundesigns@gmail.com", primary: false },
  { icon: "🏦", name: "Bank Account", detail: "****8821",               primary: false },
];