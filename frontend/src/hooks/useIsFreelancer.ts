import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Returns true ONLY if the user's `users` document has `isFreelancer: true`.
 * This flag is set by the backend when a freelancer explicitly saves their profile.
 * Regular users/clients never get this flag, even if a stub freelancer_profiles doc exists.
 */
export function useIsFreelancer(uid: string | null | undefined): boolean {
  const [isFreelancer, setIsFreelancer] = useState(false);

  useEffect(() => {
    if (!uid) { setIsFreelancer(false); return; }
    getDoc(doc(db, "users", uid))
      .then(snap => {
        if (!snap.exists()) { setIsFreelancer(false); return; }
        setIsFreelancer(snap.data()?.isFreelancer === true);
      })
      .catch(() => setIsFreelancer(false));
  }, [uid]);

  return isFreelancer;
}
