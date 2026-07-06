import { db } from "@/lib/firebase";
import {
  getDocs, collection, query, orderBy, limit, startAfter, where,
  DocumentSnapshot, Timestamp, updateDoc, doc,
} from "firebase/firestore";

export interface UserProfile {
  uid: string;
  email: string;
  display_name: string;
  photo_url?: string;
  role: string;
  phone?: string;
  is_verified?: boolean;
  created_at: number | Timestamp;
  last_seen?: number | Timestamp;
}

const usersCol = () => collection(db, "users");

export async function getUsersPage(
  pageSize: number,
  lastDoc?: DocumentSnapshot,
  role?: string
): Promise<{ users: UserProfile[]; lastDoc: DocumentSnapshot | null }> {
  const constraints: any[] = [orderBy("created_at", "desc")];
  if (role) constraints.unshift(where("role", "==", role));
  constraints.push(limit(pageSize));
  let q = query(usersCol(), ...constraints);
  if (lastDoc) {
    constraints.pop();
    constraints.push(startAfter(lastDoc), limit(pageSize));
    q = query(usersCol(), ...constraints);
  }
  const snap = await getDocs(q);
  const users = snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
  const newLastDoc = snap.docs.length === pageSize ? snap.docs[snap.docs.length - 1] : null;
  return { users, lastDoc: newLastDoc };
}

export async function getAdminUsers(): Promise<UserProfile[]> {
  const q = query(usersCol(), where("role", "==", "admin"), orderBy("created_at", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
}

export async function updateUserRole(uid: string, role: string): Promise<void> {
  await updateDoc(doc(db, "users", uid), { role });
}

export async function getUserByEmail(email: string): Promise<UserProfile | null> {
  const q = query(usersCol(), where("email", "==", email));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { uid: d.id, ...d.data() } as UserProfile;
}
