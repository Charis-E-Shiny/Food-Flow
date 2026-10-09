import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { firebaseErrorMessage, firebaseConfigError, requireFirebase } from "./firebase";

export interface User {
  uid: string;
  name: string;
  email: string;
  org: string;
  role: string;
  initials: string;
}

interface SignUpData {
  name: string;
  email: string;
  password: string;
  org: string;
  role: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "FF";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function nameFromEmail(email: string): string {
  const local = email.split("@")[0] || "there";
  return local.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}

function userFromProfile(uid: string, email: string, profile: Partial<User>): User {
  const name = typeof profile.name === "string" && profile.name ? profile.name : nameFromEmail(email);
  return {
    uid,
    name,
    email,
    org: typeof profile.org === "string" && profile.org ? profile.org : "FoodFlow Workspace",
    role: typeof profile.role === "string" && profile.role ? profile.role : "Operations",
    initials: typeof profile.initials === "string" && profile.initials ? profile.initials : initials(name),
  };
}

function profileForUser(user: User) {
  return {
    name: user.name,
    email: user.email,
    org: user.org,
    role: user.role,
    initials: user.initials,
    updatedAt: serverTimestamp(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(firebaseConfigError);

  useEffect(() => {
    if (!firebaseConfigError) {
      const { auth, db } = requireFirebase();
      return onAuthStateChanged(auth, (firebaseUser) => {
        if (!firebaseUser) {
          setUser(null);
          setError(null);
          setLoading(false);
          return;
        }

        void loadProfile(firebaseUser, db)
          .then((profile) => {
            setUser(profile);
            setError(null);
          })
          .catch((profileError: unknown) => {
            setUser(userFromProfile(firebaseUser.uid, firebaseUser.email ?? "", {}));
            setError(firebaseErrorMessage(profileError));
          })
          .finally(() => setLoading(false));
      });
    }

    setLoading(false);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      error,
      async signIn(email, password) {
        setError(null);
        try {
          const { auth } = requireFirebase();
          await signInWithEmailAndPassword(auth, email.trim(), password);
        } catch (signInError) {
          const message = firebaseErrorMessage(signInError);
          setError(message);
          throw new Error(message);
        }
      },
      async signUp({ name, email, password, org, role }) {
        setError(null);
        try {
          const { auth, db } = requireFirebase();
          const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
          const cleanName = name.trim();
          await updateProfile(credential.user, { displayName: cleanName });
          const profile = userFromProfile(credential.user.uid, email.trim(), {
            name: cleanName,
            org: org.trim() || "FoodFlow Workspace",
            role,
          });
          await setDoc(doc(db, "users", credential.user.uid), profileForUser(profile));
          setUser(profile);
        } catch (signUpError) {
          const message = firebaseErrorMessage(signUpError);
          setError(message);
          throw new Error(message);
        }
      },
      async sendPasswordReset(email) {
        setError(null);
        try {
          const { auth } = requireFirebase();
          await sendPasswordResetEmail(auth, email.trim());
        } catch (resetError) {
          const message = firebaseErrorMessage(resetError);
          setError(message);
          throw new Error(message);
        }
      },
      async signOut() {
        const { auth } = requireFirebase();
        await firebaseSignOut(auth);
      },
    }),
    [user, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

async function loadProfile(firebaseUser: FirebaseUser, db: ReturnType<typeof requireFirebase>["db"]): Promise<User> {
  const email = firebaseUser.email ?? "";
  const profileRef = doc(db, "users", firebaseUser.uid);
  const snapshot = await getDoc(profileRef);
  if (snapshot.exists()) {
    return userFromProfile(firebaseUser.uid, email, snapshot.data() as Partial<User>);
  }

  const profile = userFromProfile(firebaseUser.uid, email, {
    name: firebaseUser.displayName ?? nameFromEmail(email),
  });
  return profile;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
