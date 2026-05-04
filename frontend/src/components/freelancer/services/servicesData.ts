export interface Service {
  id:       number;
  icon:     string;
  title:    string;
  desc:     string;
  price:    string;
  delivery: string;
  orders:   number;
  rating:   number;
  status:   string;
}

export const SERVICES: Service[] = [
  { id: 1, icon: "🎨", title: "Social Media Content Package",     desc: "Complete social media kit with 30 custom templates for Instagram, Facebook & TikTok in Sinhala/English.", price: "LKR 35,000", delivery: "5 days",  orders: 12, rating: 4.9, status: "active" },
  { id: 2, icon: "🎬", title: "Video Ad Production (30 sec)",     desc: "Professional 30-second promotional video ad with motion graphics, voiceover, and brand colors.",            price: "LKR 50,000", delivery: "7 days",  orders: 8,  rating: 5.0, status: "active" },
  { id: 3, icon: "🏷️", title: "Logo & Brand Identity Design",    desc: "Full brand identity including logo, color palette, typography, and brand guidelines document.",               price: "LKR 60,000", delivery: "10 days", orders: 15, rating: 4.8, status: "active" },
  { id: 4, icon: "📧", title: "Email Campaign Design",            desc: "5 custom email templates designed for your brand — welcome, promo, newsletter, follow-up, and re-engagement.", price: "LKR 20,000", delivery: "4 days",  orders: 6,  rating: 4.7, status: "active" },
  { id: 5, icon: "🌐", title: "Shopify Store Design & Setup",     desc: "Full Shopify store setup with custom theme, product pages, and mobile-responsive design.",                     price: "LKR 75,000", delivery: "14 days", orders: 4,  rating: 5.0, status: "paused" },
  { id: 6, icon: "📸", title: "Product Photo Editing – 20 Shots", desc: "Professional editing for 20 product photos including background removal, color correction, and enhancement.", price: "LKR 12,000", delivery: "2 days",  orders: 20, rating: 4.9, status: "active" },
];

export interface NewServiceForm {
  title:    string;
  desc:     string;
  price:    string;
  delivery: string;
}

export const EMPTY_FORM: NewServiceForm = {
  title: "", desc: "", price: "", delivery: "",
};