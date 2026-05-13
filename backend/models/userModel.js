// User model — this project uses Firebase Firestore (NoSQL) as its database.
// There is no Mongoose/SQL schema. User documents are stored in the "users"
// Firestore collection with the following shape:
//
//  {
//    uid:          string   (Firebase Auth UID, also the document ID)
//    fullName:     string
//    email:        string
//    businessName: string
//    phone:        string
//    role:         "business" | "freelancer"
//    plan:         "free" | "pro" | "business"
//    language:     string   (e.g. "en")
//    profilePhoto: string   (URL)
//    createdAt:    Timestamp
//    updatedAt:    Timestamp
//  }
