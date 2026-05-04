export interface Job {
  id:       number;
  icon:     string;
  title:    string;
  client:   string;
  budget:   string;
  type:     string;
  duration: string;
  tags:     string[];
  status:   string;
  posted:   string;
}

export const JOBS: Job[] = [
  { id: 1, icon: "📱", title: "Instagram Content Designer",       client: "Amara Foods",     budget: "LKR 30,000", type: "Fixed", duration: "1 week",   tags: ["Sinhala", "Canva"],         status: "open",   posted: "2h ago" },
  { id: 2, icon: "🎬", title: "30 Sec Video Ad – Food Promo",     client: "Sathosa Lanka",   budget: "LKR 25,000", type: "Fixed", duration: "3 days",   tags: ["Video", "After Effects"],   status: "urgent", posted: "4h ago" },
  { id: 3, icon: "🏷️", title: "Full Brand Identity Package",      client: "TechStart LK",   budget: "LKR 80,000", type: "Fixed", duration: "2 weeks",  tags: ["Logo", "Branding"],         status: "open",   posted: "6h ago" },
  { id: 4, icon: "🌐", title: "Shopify Store Design & Setup",      client: "Malshi Boutique", budget: "LKR 60,000", type: "Fixed", duration: "1 week",   tags: ["Shopify", "Web"],           status: "open",   posted: "1d ago" },
  { id: 5, icon: "📧", title: "Email Campaign Design – 5 Emails", client: "Ceylon Organics", budget: "LKR 20,000", type: "Fixed", duration: "4 days",   tags: ["Email", "Design"],          status: "open",   posted: "1d ago" },
  { id: 6, icon: "📸", title: "Product Photography Editing",       client: "Hela Clothing",   budget: "LKR 15,000", type: "Fixed", duration: "2 days",   tags: ["Photoshop", "Photography"], status: "open",   posted: "2d ago" },
  { id: 7, icon: "🎨", title: "Social Media Kit – 30 Templates",  client: "Priya Beauty",    budget: "LKR 45,000", type: "Fixed", duration: "5 days",   tags: ["Canva", "Social Media"],    status: "open",   posted: "2d ago" },
  { id: 8, icon: "📊", title: "SEO Report & Keyword Strategy",     client: "Digital Edge LK", budget: "LKR 35,000", type: "Fixed", duration: "3 days",   tags: ["SEO", "Analytics"],         status: "open",   posted: "3d ago" },
];

export const CATEGORIES = ["All", "Design", "Video", "SEO", "Web", "Email", "Photography"];