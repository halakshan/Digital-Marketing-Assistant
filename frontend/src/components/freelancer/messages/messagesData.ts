export interface Chat {
  id:       number;
  name:     string;
  avatar:   string;
  gradient: string;
  last:     string;
  time:     string;
  unread:   number;
  online:   boolean;
}

export interface Message {
  from: "me" | "them";
  text: string;
  time: string;
}

export const CHATS: Chat[] = [
  { id: 1, name: "Amal Perera",  avatar: "A", gradient: "linear-gradient(135deg,#7c3aed,#3b82f6)", last: "Can you update the logo color?",    time: "2m", unread: 2, online: true  },
  { id: 2, name: "Nimal Silva",  avatar: "N", gradient: "linear-gradient(135deg,#059669,#0284c7)", last: "Can we schedule a call tomorrow?",   time: "1h", unread: 1, online: true  },
  { id: 3, name: "Sumudu Lanka", avatar: "S", gradient: "linear-gradient(135deg,#d97706,#dc2626)", last: "Great work on the Instagram posts!", time: "3h", unread: 0, online: false },
  { id: 4, name: "Priya Beauty", avatar: "P", gradient: "linear-gradient(135deg,#7c3aed,#ec4899)", last: "Please send the final files.",        time: "1d", unread: 0, online: false },
];

export const MESSAGES_MAP: Record<number, Message[]> = {
  1: [
    { from: "them", text: "Hi Kasun! The logo designs look great.",           time: "10:00 AM" },
    { from: "me",   text: "Thanks! Glad you like them.",                       time: "10:02 AM" },
    { from: "them", text: "Can you update the logo color to green?",           time: "10:05 AM" },
    { from: "me",   text: "Sure, I'll send you the updated version shortly.", time: "10:06 AM" },
  ],
  2: [
    { from: "them", text: "Hey, the video ad is looking amazing!",  time: "9:00 AM" },
    { from: "me",   text: "Thank you! Working on the final cut now.", time: "9:15 AM" },
    { from: "them", text: "Can we schedule a call tomorrow?",         time: "9:20 AM" },
  ],
  3: [
    { from: "them", text: "Great work on the Instagram posts! ⭐",             time: "Yesterday" },
    { from: "me",   text: "Thank you so much! Happy to work with you again.", time: "Yesterday" },
  ],
  4: [
    { from: "them", text: "Please send the final files when ready.", time: "Mar 10" },
    { from: "me",   text: "Will send by end of day.",                time: "Mar 10" },
  ],
};