export const TABS = ["Profile", "Account", "Notifications", "Privacy", "Payments"];

export const TAB_ICONS: Record<string, string> = {
  Profile:       "👤",
  Account:       "🔐",
  Notifications: "🔔",
  Privacy:       "🛡️",
  Payments:      "💳",
};

export interface ProfileForm {
  name:     string;
  email:    string;
  phone:    string;
  bio:      string;
  location: string;
  sinhala:  boolean;
  tamil:    boolean;
  english:  boolean;
}

export interface NotifForm {
  messages:  boolean;
  payments:  boolean;
  reviews:   boolean;
  marketing: boolean;
}

export interface PrivacyForm {
  profilePublic: boolean;
  showEarnings:  boolean;
  showLocation:  boolean;
}

export const DEFAULT_PROFILE: ProfileForm = {
  name:     "Kasun Bandara",
  email:    "kasun@example.com",
  phone:    "+94 77 123 4567",
  bio:      "Creative designer specializing in brand identities and social media content for Sri Lankan businesses.",
  location: "Colombo, Sri Lanka",
  sinhala:  true,
  tamil:    false,
  english:  true,
};

export const DEFAULT_NOTIFS: NotifForm = {
  messages:  true,
  payments:  true,
  reviews:   true,
  marketing: false,
};

export const DEFAULT_PRIVACY: PrivacyForm = {
  profilePublic: true,
  showEarnings:  false,
  showLocation:  true,
};