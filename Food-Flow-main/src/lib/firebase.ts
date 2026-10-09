import { FirebaseError, initializeApp, getApps } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missingConfig = Object.entries(config)
  .filter(([, value]) => !value)
  .map(([key]) => `VITE_FIREBASE_${key.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase()}`);

export const firebaseConfigError = missingConfig.length
  ? `Firebase is not configured. Set ${missingConfig.join(", ")} in your .env file.`
  : null;

let auth: Auth | null = null;
let db: Firestore | null = null;

if (!firebaseConfigError) {
  const app = getApps()[0] ?? initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { auth, db };

export function requireFirebase(): { auth: Auth; db: Firestore } {
  if (firebaseConfigError || !auth || !db) {
    throw new Error(firebaseConfigError ?? "Firebase services are unavailable.");
  }
  return { auth, db };
}

export function firebaseErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "The email or password is incorrect.";
      case "auth/email-already-in-use":
        return "An account already exists for this email. Try signing in.";
      case "auth/weak-password":
        return "Choose a password with at least 6 characters.";
      case "auth/invalid-email":
        return "Enter a valid email address.";
      case "auth/too-many-requests":
        return "Too many attempts. Wait a moment and try again.";
      case "auth/network-request-failed":
        return "Network error. Check your connection and try again.";
      case "permission-denied":
        return "Firestore denied this request. Check that Firestore is enabled and firestore.rules are deployed.";
      default:
        return `Firebase request failed (${error.code}).`;
    }
  }
  return error instanceof Error ? error.message : "An unexpected Firebase error occurred.";
}
