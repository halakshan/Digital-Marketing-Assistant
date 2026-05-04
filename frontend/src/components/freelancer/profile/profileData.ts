export interface PortfolioItem {
  id:    number;
  icon:  string;
  title: string;
  tag:   string;
  color: string;
}

export interface Review {
  name:  string;
  stars: number;
  date:  string;
  text:  string;
}

export const PORTFOLIO: PortfolioItem[] = [
  { id: 1, icon: "🎨", title: "Ceylonara Foods Brand Kit",     tag: "Branding",     color: "#7c3aed" },
  { id: 2, icon: "🎬", title: "Sathosa Promo Video Ad",        tag: "Video",        color: "#3b82f6" },
  { id: 3, icon: "📱", title: "Hela Clothing Instagram Kit",   tag: "Social Media", color: "#059669" },
  { id: 4, icon: "🏷️", title: "TechStart LK Logo Design",     tag: "Logo",         color: "#d97706" },
  { id: 5, icon: "🌐", title: "Malshi Boutique Shopify Store", tag: "Web Design",   color: "#dc2626" },
  { id: 6, icon: "📧", title: "Ceylon Organics Email Series",  tag: "Email",        color: "#7c3aed" },
];

export const SKILLS = [
  "Logo Design", "Social Media", "Video Editing", "Canva",
  "After Effects", "Shopify", "Sinhala Content", "Tamil Content",
  "Photography", "Email Design",
];

export const REVIEWS: Review[] = [
  { name: "Amal Perera",  stars: 5, date: "Mar 10, 2026", text: "Outstanding work! Delivered ahead of schedule and nailed our brand vision perfectly."         },
  { name: "Nimal Silva",  stars: 5, date: "Feb 28, 2026", text: "Kasun understood the Sinhala content requirement perfectly. Highly recommend!"                },
  { name: "Sumudu Lanka", stars: 5, date: "Feb 10, 2026", text: "Very professional, great communication, and the final result exceeded our expectations."       },
];

export const STATS = [
  { val: "4.9",  label: "⭐ Rating"    },
  { val: "38",   label: "Jobs Done"    },
  { val: "98%",  label: "Success"      },
  { val: "2 yrs",label: "Experience"   },
];