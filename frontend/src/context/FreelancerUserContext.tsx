"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, getIdToken } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface FreelancerUser {
  uid:             string;
  firebaseUser:    any;
  token:           string;   // Firebase ID token for backend API calls
  userName:        string;
  userInitial:     string;
  userEmail:       string;
  userPhoto:       string;
  // freelancer profile
  category:        string;
  bio:             string;
  skills:          string[];
  rate:            string;
  location:        string;
  verified:        boolean;
  rating:          number;
  reviewCount:     number;
  completedOrders: number;
  totalEarnings:   number;
  activeProjects:  number;
  available:       boolean;
  authLoading:     boolean;
  profileExists:   boolean;
}

const DEFAULT: FreelancerUser = {
  uid:"", firebaseUser:null, token:"",
  userName:"", userInitial:"F", userEmail:"", userPhoto:"",
  category:"", bio:"", skills:[], rate:"", location:"",
  verified:false, rating:0, reviewCount:0, completedOrders:0,
  totalEarnings:0, activeProjects:0, available:true,
  authLoading:true, profileExists:false,
};

const FreelancerUserContext = createContext<FreelancerUser>(DEFAULT);

export function FreelancerUserProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<FreelancerUser>(DEFAULT);

  useEffect(() => {
    let profileUnsub: (() => void) | null = null;

    let tokenRefreshInterval: NodeJS.Timeout | null = null;

    const authUnsub = onAuthStateChanged(auth, async user => {
      if (!user) { router.push("/login"); return; }

      try {
        // 1. Get Firebase ID token for backend API calls (force refresh to avoid stale cached tokens)
        const token = await getIdToken(user, true).catch(() => "");

        // Refresh token every 45 minutes (tokens expire after 60 min)
        if (tokenRefreshInterval) clearInterval(tokenRefreshInterval);
        tokenRefreshInterval = setInterval(async () => {
          const newToken = await getIdToken(user, true).catch(() => "");
          if (newToken) setState(prev => ({ ...prev, token: newToken }));
        }, 45 * 60 * 1000);

        // 2. Load base user info
        let userName = user.displayName || "Freelancer";
        let userPhoto = user.photoURL || "";
        const userSnap = await getDoc(doc(db, "users", user.uid)).catch(()=>null);
        if (userSnap?.exists()) {
          const d = userSnap.data();
          userName  = d.fullName || userName;
          userPhoto = d.profilePhoto || userPhoto;
        }

        setState(prev => ({
          ...prev,
          uid: user.uid,
          firebaseUser: user,
          token,
          userName,
          userInitial: userName.charAt(0).toUpperCase(),
          userEmail: user.email || "",
          userPhoto,
          authLoading: false,
        }));

        // 3. Real-time listener on freelancer_profiles/{uid}
        profileUnsub = onSnapshot(
          doc(db, "freelancer_profiles", user.uid),
          snap => {
            if (snap.exists()) {
              const p = snap.data();
              setState(prev => ({
                ...prev,
                category:        p.category        || "",
                bio:             p.bio             || "",
                skills:          p.skills          || [],
                rate:            p.rate            || "",
                location:        p.location        || "",
                verified:        p.verified        || false,
                rating:          p.rating          || 0,
                reviewCount:     p.reviewCount     || 0,
                completedOrders: p.completedOrders || 0,
                totalEarnings:   p.totalEarnings   || 0,
                activeProjects:  p.activeProjects  || 0,
                available:       p.available !== undefined ? p.available : true,
                profileExists:   true,
              }));
            } else {
              setState(prev => ({ ...prev, profileExists: false }));
            }
          },
          err => {
            if (err.code !== "permission-denied") console.error("freelancer_profiles:", err);
            setState(prev => ({ ...prev, profileExists: false }));
          }
        );
      } catch (err: any) {
        // Swallow Firebase permission errors silently; log anything unexpected
        if (err?.code !== "permission-denied") console.error("FreelancerUserContext:", err);
        setState(prev => ({ ...prev, authLoading: false }));
      }
    });

    return () => {
      authUnsub();
      profileUnsub?.();
      if (tokenRefreshInterval) clearInterval(tokenRefreshInterval);
    };
  }, [router]);

  return (
    <FreelancerUserContext.Provider value={state}>
      {children}
    </FreelancerUserContext.Provider>
  );
}

export const useFreelancerUser = () => useContext(FreelancerUserContext);
